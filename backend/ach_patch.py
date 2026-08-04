class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    from .models import Achievement, UserAchievement
    from .serializers import AchievementSerializer, UserAchievementSerializer
    queryset = Achievement.objects.all().order_by('difficulty')
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        from django.db.models import Sum, Count
        from .models import PirepsFlight, LandingReport
        queryset = self.get_queryset()
        
        approved_pireps = PirepsFlight.objects.filter(pilot=request.user, status='Approved')
        stats = approved_pireps.aggregate(
            total_duration=Sum('flight_duration'),
            total_fuel=Sum('fuel_used_kg'),
            total_baggage=Sum('baggage_kg'),
            total_pax=Sum('passengers')
        )
        
        total_flights = approved_pireps.count()
        total_hours = (stats['total_duration'].total_seconds() / 3600.0) if stats['total_duration'] else 0
        total_baggage = stats['total_baggage'] or 0
        total_pax = stats['total_pax'] or 0
        
        departures = set(approved_pireps.values_list('departure_airport', flat=True))
        arrivals = set(approved_pireps.values_list('arrival_airport', flat=True))
        total_airports = len(departures.union(arrivals))
        
        airbus_flights = approved_pireps.filter(aircraft__icontains='Airbus').count()
        boeing_flights = approved_pireps.filter(aircraft__icontains='Boeing').count()
        embraer_flights = approved_pireps.filter(aircraft__icontains='Embraer').count()
        cessna_flights = approved_pireps.filter(aircraft__icontains='Cessna').count()
        pax_flights = approved_pireps.filter(flight_type='Free Flight Pax').count()
        cargo_flights = approved_pireps.filter(flight_type='Free Flight Cargo').count()
        wt_flights = approved_pireps.filter(flight_type='World Tour').count()
        simbrief_flights = approved_pireps.filter(passengers__isnull=False, baggage_kg__isnull=False).count()
        
        from datetime import timedelta
        short_haul = approved_pireps.filter(flight_duration__lt=timedelta(hours=3)).count()
        medium_haul = approved_pireps.filter(flight_duration__gte=timedelta(hours=3), flight_duration__lte=timedelta(hours=12)).count()
        long_haul = approved_pireps.filter(flight_duration__gt=timedelta(hours=12)).count()
        
        expert_server = approved_pireps.filter(network__icontains='Expert').count()
        training_server = approved_pireps.filter(network__icontains='Training').count()
        casual_server = approved_pireps.filter(network__icontains='Casual').count()
        
        user_landing_reports = LandingReport.objects.filter(pilot=request.user, pirep__status='Approved')
        perfect_landings = user_landing_reports.filter(score=10.0).count()
        terrible_landings = user_landing_reports.filter(score=0.0).count()
        
        years_service = 0
        if request.user.if_first_flight_date:
            from django.utils import timezone
            years_service = (timezone.now() - request.user.if_first_flight_date).days // 365
        else:
            first_flight = approved_pireps.order_by('registration_date').first()
            if first_flight:
                from django.utils import timezone
                years_service = (timezone.now() - first_flight.registration_date).days // 365
                
        data = []
        for ach in queryset:
            ach_data = self.get_serializer(ach).data
            prog = 0
            if ach.metric == 'TOTAL_FLIGHTS': prog = total_flights
            elif ach.metric == 'TOTAL_HOURS': prog = int(total_hours)
            elif ach.metric == 'TOTAL_BAGGAGE': prog = total_baggage
            elif ach.metric == 'TOTAL_PASSENGERS': prog = total_pax
            elif ach.metric == 'TOTAL_AIRPORTS': prog = total_airports
            elif ach.metric == 'AIRBUS_FLIGHTS': prog = airbus_flights
            elif ach.metric == 'BOEING_FLIGHTS': prog = boeing_flights
            elif ach.metric == 'EMBRAER_FLIGHTS': prog = embraer_flights
            elif ach.metric == 'CESSNA_FLIGHTS': prog = cessna_flights
            elif ach.metric == 'PAX_FLIGHTS': prog = pax_flights
            elif ach.metric == 'CARGO_FLIGHTS': prog = cargo_flights
            elif ach.metric == 'WT_FLIGHTS': prog = wt_flights
            elif ach.metric == 'SIMBRIEF_FLIGHTS': prog = simbrief_flights
            elif ach.metric == 'SHORT_HAUL': prog = short_haul
            elif ach.metric == 'MEDIUM_HAUL': prog = medium_haul
            elif ach.metric == 'LONG_HAUL': prog = long_haul
            elif ach.metric == 'PERFECT_LANDINGS': prog = perfect_landings
            elif ach.metric == 'TERRIBLE_LANDINGS': prog = terrible_landings
            elif ach.metric == 'EXPERT_SERVER': prog = expert_server
            elif ach.metric == 'TRAINING_SERVER': prog = training_server
            elif ach.metric == 'CASUAL_SERVER': prog = casual_server
            elif ach.metric == 'YEARS_SERVICE': prog = years_service
            
            ach_data['current_progress'] = prog
            data.append(ach_data)
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def user_achievements(self, request):
        from .models import UserAchievement
        from .serializers import UserAchievementSerializer
        user_achievements = UserAchievement.objects.filter(user=request.user)
        serializer = UserAchievementSerializer(user_achievements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        from .models import UserAchievement
        from .serializers import UserAchievementSerializer
        unread = UserAchievement.objects.filter(user=request.user, viewed=False)
        serializer = UserAchievementSerializer(unread, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        from .models import UserAchievement
        ids = request.data.get('ids', [])
        UserAchievement.objects.filter(user=request.user, id__in=ids).update(viewed=True)
        return Response({'status': 'success'})

def get_if_first_flight_date(user):
    if user.if_first_flight_date:
        return user.if_first_flight_date
        
    if not user.usernameIFC:
        return None
        
    import os
    api_key = os.environ.get('VITE_API_KEY', '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4')
    headers = {'Authorization': f'Bearer {api_key}'}
    try:
        import requests
        from django.utils.dateparse import parse_datetime
        user_res = requests.post("https://api.infiniteflight.com/public/v2/users", 
                                 json={'discourseNames': [user.usernameIFC]}, 
                                 headers=headers, timeout=10)
        if user_res.status_code == 200:
            user_data = user_res.json()
            if user_data.get('errorCode') == 0 and user_data.get('result'):
                if_user_id = user_data['result'][0].get('userId')
                if if_user_id:
                    flights_res = requests.get(f"https://api.infiniteflight.com/public/v2/users/{if_user_id}/flights?page=1", 
                                               headers=headers, timeout=10)
                    if flights_res.status_code == 200:
                        flights_data = flights_res.json()
                        total_pages = flights_data.get('result', {}).get('totalPages', 1)
                        
                        last_page_res = requests.get(f"https://api.infiniteflight.com/public/v2/users/{if_user_id}/flights?page={total_pages}", 
                                                     headers=headers, timeout=10)
                        if last_page_res.status_code == 200:
                            last_data = last_page_res.json()
                            flights_list = last_data.get('result', {}).get('data', [])
                            if flights_list:
                                earliest_flight_str = flights_list[-1].get('created')
                                if earliest_flight_str:
                                    dt = parse_datetime(earliest_flight_str)
                                    if dt:
                                        user.if_first_flight_date = dt
                                        user.save(update_fields=['if_first_flight_date'])
                                        return dt
    except Exception as e:
        print(f"Error fetching IF first flight date: {e}")
        
    return None

def check_achievements(user):
    from django.db.models import Sum, Count
    from .models import PirepsFlight, Achievement, UserAchievement
    
    approved_pireps = PirepsFlight.objects.filter(pilot=user, status='Approved')
    stats = approved_pireps.aggregate(
        total_duration=Sum('flight_duration'),
        total_fuel=Sum('fuel_used_kg'),
        total_baggage=Sum('baggage_kg'),
        total_pax=Sum('passengers')
    )
    
    total_flights = approved_pireps.count()
    total_hours = (stats['total_duration'].total_seconds() / 3600.0) if stats['total_duration'] else 0
    total_baggage = stats['total_baggage'] or 0
    total_pax = stats['total_pax'] or 0
    
    departures = set(approved_pireps.values_list('departure_airport', flat=True))
    arrivals = set(approved_pireps.values_list('arrival_airport', flat=True))
    total_airports = len(departures.union(arrivals))
    
    all_achievements = Achievement.objects.all()
    user_achievements = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    
    for ach in all_achievements:
        if ach.id in user_achievements:
            continue
            
        unlocked = False
        
        if ach.metric == 'TOTAL_FLIGHTS' and total_flights >= ach.target_value:
            unlocked = True
        elif ach.metric == 'TOTAL_HOURS' and total_hours >= ach.target_value:
            unlocked = True
        elif ach.metric == 'TOTAL_BAGGAGE' and total_baggage >= ach.target_value:
            unlocked = True
        elif ach.metric == 'TOTAL_PASSENGERS' and total_pax >= ach.target_value:
            unlocked = True
        elif ach.metric == 'TOTAL_AIRPORTS' and total_airports >= ach.target_value:
            unlocked = True
        elif ach.metric == 'AIRBUS_FLIGHTS':
            if approved_pireps.filter(aircraft__icontains='Airbus').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'BOEING_FLIGHTS':
            if approved_pireps.filter(aircraft__icontains='Boeing').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'EMBRAER_FLIGHTS':
            if approved_pireps.filter(aircraft__icontains='Embraer').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'CESSNA_FLIGHTS':
            if approved_pireps.filter(aircraft__icontains='Cessna').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'PAX_FLIGHTS':
            if approved_pireps.filter(flight_type='Free Flight Pax').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'CARGO_FLIGHTS':
            if approved_pireps.filter(flight_type='Free Flight Cargo').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'WT_FLIGHTS':
            if approved_pireps.filter(flight_type='World Tour').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'SIMBRIEF_FLIGHTS':
            if approved_pireps.filter(passengers__isnull=False, baggage_kg__isnull=False).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'SHORT_HAUL':
            from datetime import timedelta
            if approved_pireps.filter(flight_duration__lt=timedelta(hours=3)).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'MEDIUM_HAUL':
            from datetime import timedelta
            if approved_pireps.filter(flight_duration__gte=timedelta(hours=3), flight_duration__lte=timedelta(hours=12)).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'LONG_HAUL':
            from datetime import timedelta
            if approved_pireps.filter(flight_duration__gt=timedelta(hours=12)).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'PERFECT_LANDINGS':
            from .models import LandingReport
            if LandingReport.objects.filter(pilot=user, pirep__status='Approved', score=10.0).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'TERRIBLE_LANDINGS':
            from .models import LandingReport
            if LandingReport.objects.filter(pilot=user, pirep__status='Approved', score=0.0).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'EXPERT_SERVER':
            if approved_pireps.filter(network__icontains='Expert').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'TRAINING_SERVER':
            if approved_pireps.filter(network__icontains='Training').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'CASUAL_SERVER':
            if approved_pireps.filter(network__icontains='Casual').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'YEARS_SERVICE':
            dt = get_if_first_flight_date(user)
            if not dt:
                first = approved_pireps.order_by('registration_date').first()
                if first: dt = first.registration_date
            if dt:
                from django.utils import timezone
                years_service = (timezone.now() - dt).days // 365
                if years_service >= ach.target_value:
                    unlocked = True
        elif ach.metric == 'IFC_COMMENT':
            if user.usernameIFC:
                import urllib.request, json
                try:
                    req = urllib.request.Request('https://community.infiniteflight.com/t/1239919.json', headers={'User-Agent': 'Mozilla/5.0'})
                    resp = urllib.request.urlopen(req, timeout=5)
                    data = json.loads(resp.read())
                    participants = [p.get('username', '').lower() for p in data.get('details', {}).get('participants', [])]
                    if user.usernameIFC.lower() in participants:
                        unlocked = True
                except Exception as e:
                    print(f"Error checking IFC topic: {e}")
            
        if unlocked:
            UserAchievement.objects.create(user=user, achievement=ach)
