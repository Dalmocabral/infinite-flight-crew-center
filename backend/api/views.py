from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from django.contrib.auth import get_user_model, authenticate
from django.db.models import Sum, Count, Avg
from django.http import HttpResponse
from django.utils import timezone

from knox.models import AuthToken
from datetime import timedelta
import secrets
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
import requests
import os

from .serializers import *
from .models import *  # Explicitly import models if needed, though * is often discouraged.
from .utils import send_welcome_email

User = get_user_model()

class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]  # Permite acesso sem autenticação
    serializer_class = RegisterSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()  # Salva o usuário
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user = authenticate(request, email=email, password=password)

            if user:
                # Verificar inatividade (30 dias)
                if user.last_login and (timezone.now() - user.last_login) > timedelta(days=30):
                    user.is_active_pilot = False
                    user.save()

                if not getattr(user, 'is_active_pilot', True):
                    return Response({'error': 'INACTIVE_ACCOUNT', 'message': 'Account is inactive.'}, status=403)

                _, token = AuthToken.objects.create(user)

                return Response(
                    {
                        'user': self.serializer_class(user).data,
                        'token': token
                    }
                )
            else:
                return Response({'error': 'Invalid credentials'}, status=401)
        
        else:
            return Response(serializer.errors, status=400)
        
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]  # Permite acesso sem autenticação
    serializer_class = UserSerializer  # Use o UserSerializer aqui
    queryset = User.objects.all()

    def list(self, request):
        queryset = User.objects.all().order_by('-is_active_pilot', 'date_joined')
        serializer = self.serializer_class(queryset, many=True)  # Serializa os dados dos usuários
        return Response(serializer.data)
    
class PirepsFlightViewset(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PirepsFlightSerializer
    queryset = PirepsFlight.objects.all()

    def list(self, request, *args, **kwargs):
        # Auto-expire scheduled Free Flights older than 24 hours
        from django.utils import timezone
        import datetime
        expiration_date = timezone.now() - datetime.timedelta(hours=24)
        PirepsFlight.objects.filter(
            status='Scheduled',
            flight_type__in=['Free Flight Pax', 'Free Flight Cargo'],
            registration_date__lt=expiration_date
        ).delete()
        
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        req_status = self.request.data.get('status', 'In Review')
        if req_status not in ['Scheduled', 'In Review', 'Approved']:
            req_status = 'In Review'
            
        pirep = serializer.save(pilot=self.request.user, status=req_status)
        
        self._process_auto_validation(pirep)

    def perform_update(self, serializer):
        pirep = serializer.save()
        self._process_auto_validation(pirep)
        
    def _process_auto_validation(self, pirep):
        if pirep.submission_type == "Auto" and self.request.user.usernameIFC and not LandingReport.objects.filter(pirep=pirep).exists():
            api_key = os.environ.get('VITE_API_KEY', '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4')
            
            try:
                # 1. Obter o userId do Infinite Flight
                url_users = "https://api.infiniteflight.com/public/v2/users"
                headers = {'Authorization': f'Bearer {api_key}'}
                payload = {'discourseNames': [self.request.user.usernameIFC]}
                
                user_res = requests.post(url_users, json=payload, headers=headers, timeout=10)
                if user_res.status_code == 200:
                    user_data = user_res.json()
                    if user_data.get('errorCode') == 0 and user_data.get('result') and len(user_data['result']) > 0:
                        if_user_id = user_data['result'][0].get('userId')
                        
                        if if_user_id:
                            # 2. Obter o Logbook do usuário
                            url_flights = f"https://api.infiniteflight.com/public/v2/users/{if_user_id}/flights"
                            flights_res = requests.get(url_flights, headers=headers, timeout=10)
                            
                            if flights_res.status_code == 200:
                                flights_data = flights_res.json()
                                if flights_data.get('errorCode') == 0 and flights_data.get('result'):
                                    flight_list = flights_data['result'].get('data', [])
                                    
                                    # 3. Procurar o voo correspondente
                                    matched_flight = None
                                    for f in flight_list:
                                        if (f.get('originAirport') == pirep.departure_airport or f.get('departureAirport') == pirep.departure_airport) and \
                                           (f.get('destinationAirport') == pirep.arrival_airport or f.get('arrivalAirport') == pirep.arrival_airport):
                                            
                                            # Verifica se este voo da API já foi usado em outro PIREP
                                            if_id = f.get('id')
                                            
                                            if_aircraft_id = f.get('aircraftId')
                                            aircraft_match = True
                                            if if_aircraft_id and if_aircraft_id != '00000000-0000-0000-0000-000000000000':
                                                try:
                                                    ac = Aircraft.objects.get(if_id=if_aircraft_id)
                                                    if ac.name != pirep.aircraft:
                                                        aircraft_match = False
                                                except Aircraft.DoesNotExist:
                                                    pass
                                                    
                                            if aircraft_match and if_id and not LandingReport.objects.filter(if_flight_id=if_id).exists():
                                                matched_flight = f
                                                break
                                            
                                    if matched_flight:
                                        # 4. Criar o LandingReport com as físicas e violações
                                        landing_stats = matched_flight.get('landingStats', [])
                                        violations = matched_flight.get('violations', [])
                                        
                                        report = LandingReport(
                                            pilot=self.request.user,
                                            pirep=pirep,
                                            aircraft=pirep.aircraft,
                                            if_flight_id=matched_flight.get('id'),
                                            if_user_id=if_user_id,
                                            status='COMPLETED'
                                        )
                                        
                                        # Atualiza o combustível usando os dados do Infinite Flight
                                        if_fuel = matched_flight.get('fuelUsedKg')
                                        if if_fuel is not None:
                                            pirep.fuel_used_kg = if_fuel
                                            pirep.save(update_fields=['fuel_used_kg'])
                                            
                                        penalty = 0
                                        base_score = 10.0
                                        
                                        # Aplicar penalidade por violações do Infinite Flight (ex: Overspeed, ATC)
                                        if violations:
                                            report.ias_violations = len(violations) # Usamos o campo ias_violations para guardar o num de IF violations
                                            penalty += len(violations) * 3.0
                                        
                                        if landing_stats:
                                            best_landing = landing_stats[0] # Pegamos o primeiro toque ou o mais suave
                                            
                                            # Converter verticalSpeed (m/s) para FPM (1 m/s = 196.85 fpm)
                                            vs_ms = best_landing.get('verticalSpeed', 0)
                                            report.vs_touchdown = int(vs_ms * 196.85)
                                            report.g_force = best_landing.get('maxGForce', 1.0)
                                            report.centerline = best_landing.get('centerlineDistance', 0.0)
                                            report.distance_from_1kft = best_landing.get('distanceFrom1kftMarker', 0.0)
                                            
                                            # Custom Penalty Logic (FPM + G-Force + Centerline)
                                            
                                            # FPM (Vertical Speed)
                                            vs_abs = abs(report.vs_touchdown)
                                            if vs_abs > 200:
                                                if vs_abs <= 400:
                                                    penalty += 1.0 # Normal
                                                elif vs_abs <= 600:
                                                    penalty += 3.0 # Firm
                                                elif vs_abs <= 1000:
                                                    penalty += 6.0 # Hard
                                                else:
                                                    penalty += 10.0 # Extremely Hard
                                                    
                                            # G-Force
                                            if report.g_force > 1.20:
                                                if report.g_force <= 1.50:
                                                    penalty += 1.0
                                                elif report.g_force <= 2.00:
                                                    penalty += 3.0
                                                elif report.g_force <= 3.00:
                                                    penalty += 6.0
                                                else:
                                                    penalty += 10.0
                                                    
                                            # Centerline Deviation
                                            c_dev = abs(report.centerline)
                                            if c_dev > 5.0:
                                                if c_dev <= 10.0:
                                                    penalty += 1.0
                                                elif c_dev <= 15.0:
                                                    penalty += 3.0
                                                elif c_dev <= 25.0:
                                                    penalty += 6.0
                                                else:
                                                    penalty += 10.0
                                        
                                        report.score = max(0.0, base_score - penalty)
                                        report.save()
            except Exception as e:
                print("Erro ao processar integração Logbook IF:", e)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pilot != request.user:
            raise PermissionDenied("Você não tem permissão para editar este PIREP.")
        if instance.status not in ["In Review", "Scheduled"]:
            return Response(
                {"detail": "Este PIREP não pode ser editado porque não está em análise nem agendado."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pilot != request.user:
            raise PermissionDenied("Você não tem permissão para excluir este PIREP.")
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class MyFlightsViewSet(viewsets.ReadOnlyModelViewSet):  
    """ViewSet para listar os voos do usuário logado."""
    serializer_class = PirepsFlightSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        queryset = PirepsFlight.objects.filter(pilot=request.user)
        serializer = self.serializer_class(queryset, many=True)

        return Response(serializer.data)
    
class DashboardViewSet(viewsets.ViewSet):
    
    serializer_class = PirepsFlightSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        # Dados do usuário logado
        user_flights = PirepsFlight.objects.filter(pilot=request.user)
        serializer = self.serializer_class(user_flights, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def rankings(self, request):
        
        # Top 5 Duração de Voo
        top_duration = (
            PirepsFlight.objects.filter(status="Approved", pilot__is_active_pilot=True)
            .values("pilot__first_name", "pilot__last_name", "pilot__country")
            .annotate(total_duration=Sum("flight_duration"))
            .order_by("-total_duration")[:5]
        )

        # Top 5 Total de Voos
        top_flights = (
            PirepsFlight.objects.filter(status="Approved", pilot__is_active_pilot=True)
            .values("pilot__first_name", "pilot__last_name", "pilot__country")
            .annotate(total_flights=Count("id"))
            .order_by("-total_flights")[:5]
        )

        # Top 5 Média de Rating (Usando a tabela LandingReport)
        top_ratings = (
            LandingReport.objects.filter(pilot__is_active_pilot=True)
            .values("pilot__first_name", "pilot__last_name", "pilot__country")
            .annotate(avg_score=Avg("score"))
            .order_by("-avg_score")[:5]
        )

        return Response({
            "top_duration": list(top_duration),
            "top_flights": list(top_flights),
            "top_ratings": list(top_ratings),
        })
    
class AwardViewSet(viewsets.ModelViewSet):
    queryset = Award.objects.all().order_by('-id')
    serializer_class = AwardsSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def pilot_progress(self, request, pk=None):
        award = self.get_object()
        user_awards = UserAward.objects.filter(award=award).select_related('user')
        flight_legs = list(award.flight_legs.all().order_by('id'))
        
        allowed_icaos = set(icao.company_icao.upper() for icao in award.allowed_icao.all())
        allowed_aircrafts = set(allowed.aircraft.name for allowed in award.allowed_aircrafts.all())
        allowed_cats = set(cat.category for cat in award.allowed_categories.all())
        has_aircraft_restriction = bool(allowed_aircrafts or allowed_cats)
        
        # Pre-fetch aircraft categories to optimize
        aircraft_map = {a.name: a.category for a in Aircraft.objects.all()}
        
        results = []
        for ua in user_awards:
            user_flights = PirepsFlight.objects.filter(pilot=ua.user, status='Approved').order_by('registration_date')
            
            completed_legs = {}
            used_flight_ids = set()  # Cada PIREP só pode completar UMA perna

            for idx, required_flight in enumerate(flight_legs):
                for user_flight in user_flights:
                    # Pula PIREPs que já foram usados em outras pernas
                    if user_flight.id in used_flight_ids:
                        continue

                    if required_flight.from_airport == user_flight.departure_airport and required_flight.to_airport == user_flight.arrival_airport:
                        flight_icao = user_flight.flight_icao.upper() if user_flight.flight_icao else ""
                        icao_check = not allowed_icaos or flight_icao in allowed_icaos
                        
                        aircraft_check = True
                        if has_aircraft_restriction:
                            aircraft_category = aircraft_map.get(user_flight.aircraft, 'Uncategorized')
                            if user_flight.aircraft in allowed_aircrafts or aircraft_category in allowed_cats:
                                aircraft_check = True
                            else:
                                aircraft_check = False
                                
                        if icao_check and aircraft_check:
                            completed_legs[f'leg_{idx+1}'] = user_flight.registration_date.strftime('%d %b %Y, %H:%M')
                            used_flight_ids.add(user_flight.id)  # Marca como usado
                            break

                            
            results.append({
                'user_id': ua.user.id,
                'user_name': f"{ua.user.first_name} {ua.user.last_name}",
                'progress': ua.progress,
                'start_date': ua.start_date.strftime('%d %b %Y') if ua.start_date else None,
                'end_date': ua.end_date.strftime('%d %b %Y') if ua.end_date else None,
                'completed_legs': completed_legs
            })
            
        return Response({
            'total_legs': len(flight_legs),
            'pilots': results
        })

class AircraftViewSet(viewsets.ModelViewSet):
    queryset = Aircraft.objects.all().order_by('name')
    serializer_class = AircraftSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def lookup_by_livery(self, request):
        livery_id = request.query_params.get('livery_id')
        if not livery_id:
            return Response({"error": "livery_id is required"}, status=400)
        
        try:
            livery = Livery.objects.select_related('aircraft').get(livery_id=livery_id)
            return Response({
                "aircraft_id": str(livery.aircraft.if_id),
                "aircraft_name": livery.aircraft.name,
                "livery_name": livery.name,
                "category": livery.aircraft.category
            })
        except Livery.DoesNotExist:
            return Response({"error": "Livery not found in database"}, status=404)

class FlightLegViewSet(viewsets.ModelViewSet):
    serializer_class = FlightLegSerializer
    permission_classes = [permissions.IsAuthenticated]  # Apenas usuários autenticados
    queryset = FlightLeg.objects.all()  # Define o queryset padrão

    def get_queryset(self):
        # Filtra as FlightLeg com base no award_id
        queryset = super().get_queryset()  # Usa o queryset padrão
        award_id = self.request.query_params.get('award', None)
        if award_id:
            queryset = queryset.filter(award_id=award_id)
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Busca todos os PIREPs aprovados do usuário, em ordem cronológica
        user_pireps = list(
            PirepsFlight.objects.filter(
                pilot=request.user,
                status='Approved'
            ).order_by('registration_date')
            .values('departure_airport', 'arrival_airport', 'status')
        )

        # Monta um pool de PIREPs disponíveis por rota: {(dep, arr): [pirep, pirep, ...]}
        from collections import defaultdict
        pirep_pool = defaultdict(list)
        for p in user_pireps:
            pirep_pool[(p['departure_airport'], p['arrival_airport'])].append(p)

        # Para cada perna, consome UM pirep do pool (em ordem cronológica)
        # Isso garante que rotas repetidas exijam múltiplos PIREPs separados
        for leg_data in response.data:
            key = (leg_data['from_airport'], leg_data['to_airport'])
            if pirep_pool[key]:
                pirep = pirep_pool[key].pop(0)  # Consome o mais antigo disponível
                leg_data['pirep_status'] = pirep['status']
            else:
                leg_data['pirep_status'] = None

        return response


class AllowedAircraftViewSet(viewsets.ModelViewSet):
    queryset = AllowedAircraft.objects.all()
    serializer_class = AllowedAircraftSerializer
    permission_classes = [permissions.AllowAny]

class AllowedIcaoViewSet(viewsets.ModelViewSet):
    queryset = AllowedIcao.objects.all()
    serializer_class = AllowedIcaoSerializer
    permission_classes = [permissions.AllowAny]

class UserAwardViewSet(viewsets.ModelViewSet):
    queryset = UserAward.objects.all()
    serializer_class = UserAwardSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get("user")

        if user_id:
            return self.queryset.filter(user__id=user_id)
        
        # Se nenhum usuário foi passado, retorna os prêmios do usuário autenticado
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)

        return self.queryset.none()  # Se não houver usuário autenticado, retorna vazio

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def get(self, request):
        user = request.user  # Obtém o usuário logado
        serializer = UserSerializer(user)  # Serializa os dados do usuário
        return Response(serializer.data)  # Retorna os dados serializados
    
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user, is_read=False).order_by('-created_at')

    @action(detail=True, methods=['POST'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "Notification marked as read"}, status=status.HTTP_200_OK)
    
class UserDetailViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def retrieve(self, request, pk=None):
        try:
            user = CustomUser.objects.get(id=pk)  # Busca o usuário pelo ID
            serializer = UserSerializer(user)  # Serializa os dados do usuário
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
class UserMetricsViewSet(ViewSet):
    def retrieve(self, request, pk=None):
        try:
            # Filtra os PIREPs do usuário com status "Approved"
            approved_pireps = PirepsFlight.objects.filter(pilot_id=pk, status="Approved")

            # Filtra os PIREPs aprovados nos últimos 30 dias
            thirty_days_ago = timezone.now() - timedelta(days=30)
            approved_pireps_last_30_days = approved_pireps.filter(registration_date__gte=thirty_days_ago)

            # --- Aggregation Metrics ---
            metrics_all_time = approved_pireps.aggregate(
                total_flights=Count('id'),
                total_duration=Sum('flight_duration'),
                total_fuel_used=Sum('fuel_used_kg'),
                total_baggage=Sum('baggage_kg')
            )

            metrics_30_days = approved_pireps_last_30_days.aggregate(
                total_flights=Count('id'),
                total_duration=Sum('flight_duration'),
                total_fuel_used=Sum('fuel_used_kg'),
                total_baggage=Sum('baggage_kg')
            )

            # --- Extract Values ---
            total_flights = metrics_all_time['total_flights'] or 0
            total_duration = metrics_all_time['total_duration'] or timedelta(0)
            total_fuel_used = (metrics_all_time['total_fuel_used'] or 0) / 1000
            total_baggage = (metrics_all_time['total_baggage'] or 0) / 1000

            total_flights_last_30_days = metrics_30_days['total_flights'] or 0
            total_duration_last_30_days = metrics_30_days['total_duration'] or timedelta(0)

            # --- Helpers ---
            def format_duration(duration):
                total_seconds = int(duration.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return f"{hours}:{minutes:02d}"

            # --- Calculations ---
            total_flight_time_hh_mm = format_duration(total_duration)
            total_flight_time_last_30_days_hh_mm = format_duration(total_duration_last_30_days)
            
            # Averages
            # Note: The original code divided hours by 30. We keep this logic.
            total_hours_last_30 = total_duration_last_30_days.total_seconds() / 3600
            
            average_flights_per_day = total_flights_last_30_days / 30
            average_flight_time_per_day = total_hours_last_30 / 30

            # Retorna as métricas
            metrics = {
                "total_flights": total_flights,
                "total_flight_time": total_flight_time_hh_mm,
                "total_flights_last_30_days": total_flights_last_30_days,
                "total_flight_time_last_30_days": total_flight_time_last_30_days_hh_mm,
                "average_flights_per_day": average_flights_per_day,
                "average_flight_time_per_day": average_flight_time_per_day,
                "total_fuel_tons": round(total_fuel_used, 2),
                "total_baggage_tons": round(total_baggage, 2),
            }

            return Response(metrics, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserApprovedFlightsViewSet(ViewSet):
    def retrieve(self, request, pk=None):
        try:
            # Filtra os voos aprovados do usuário
            approved_flights = PirepsFlight.objects.filter(pilot_id=pk, status="Approved")
            flights_data = []

            for flight in approved_flights:
                score = None
                try:
                    if flight.landing_report:
                        score = flight.landing_report.score
                except Exception:
                    pass

                flights_data.append({
                    "id": flight.id,
                    "flight_icao": flight.flight_icao,
                    "flight": flight.flight_number,
                    "dep": flight.departure_airport,
                    "arr": flight.arrival_airport,
                    "date": flight.registration_date,
                    "network": flight.network,
                    "duration": flight.flight_duration,
                    "aircraft": flight.aircraft,
                    "livery_id": str(flight.livery_id) if flight.livery_id else None,
                    "status": flight.status,
                    "landing_report": {
                        "score": score
                    }
                })

            return Response(flights_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # Obtém o usuário logado
        serializer = ProfileUpdateSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user  # Obtém o usuário logado
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class FlightStatsView(APIView):
    """
    Retorna estatísticas gerais de voos, como total de voos e total de horas voadas.
    """
    def get(self, request):
        total_flights = PirepsFlight.objects.count()
        total_pilots = CustomUser.objects.count()

        # Calculate unique airports visited (departures + arrivals)
        departures = set(PirepsFlight.objects.values_list('departure_airport', flat=True))
        arrivals = set(PirepsFlight.objects.values_list('arrival_airport', flat=True))
        total_airports = len(departures.union(arrivals))

        # Obtém o total de tempo de voo (timedelta)
        total_duration = PirepsFlight.objects.aggregate(total_duration=Sum("flight_duration"))["total_duration"]

        # Converte timedelta para horas decimais (exemplo: 2h 30min = 2.5)
        total_hours = total_duration.total_seconds() / 3600 if total_duration else 0

        # Totais adicionais (Combustível, Bagagem e Passageiros)
        totals = PirepsFlight.objects.aggregate(
            total_fuel=Sum("fuel_used_kg"),
            total_baggage=Sum("baggage_kg"),
            total_passengers=Sum("passengers")
        )

        total_fuel_tons = (totals["total_fuel"] or 0) / 1000
        total_baggage_tons = (totals["total_baggage"] or 0) / 1000
        total_passengers = totals["total_passengers"] or 0

        return Response({
            "total_flights": total_flights,
            "total_hours": round(total_hours, 2),
            "total_pilots": total_pilots,
            "total_airports": total_airports,
            "total_fuel_tons": round(total_fuel_tons, 2),
            "total_baggage_tons": round(total_baggage_tons, 2),
            "total_passengers": total_passengers
        })

class ValidateTokenView(APIView):
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def get(self, request):
        # Se o token for válido, o usuário já está autenticado
        return Response({"message": "Valid token"}, status=status.HTTP_200_OK)

class ReactivateAccountView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=400)
            
        try:
            user = User.objects.get(reactivation_token=token)
            user.is_active_pilot = True
            user.reactivation_token = None
            user.save()
            return Response({'message': 'Account reactivated successfully'}, status=200)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=400)

class RequestReactivationEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        try:
            user = User.objects.get(email=email)
            if user.is_active_pilot:
                return Response({'error': 'This user is not inactive.'}, status=400)
                
            # Generates token and sends email
            token = secrets.token_urlsafe(32)
            user.reactivation_token = token
            user.save()

            import os
            site_link = os.environ.get('FRONTEND_URL', 'https://worldtourinfinte.vercel.app/')
            if not site_link.endswith('/'):
                site_link += '/'
            full_link = f"{site_link}reactivate-account?token={token}"

            html_message = f"<p>Hello {user.first_name},</p><p>We received your reactivation request! Click the link below to take the controls again:</p><p><a href='{full_link}'>Reactivate Account</a></p>"
            plain_message = strip_tags(html_message)

            msg = EmailMultiAlternatives(
                subject="Account Reactivation - System Infinite World Tour",
                body=plain_message,
                from_email="sysinfiniteworldtour@gmail.com",
                to=[user.email],
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()
            
            return Response({'message': 'Email sent successfully'}, status=200)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)


def test_email(request):
    send_welcome_email("destinatario@email.com")
    return HttpResponse("Email sent successfully!")


# ── LANDING REPORT (Co-Piloto Virtual) ───────────────────────────────────────
class LandingReportView(APIView):
    """Recebe dados de pouso do app mobile e salva no banco."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        report = LandingReport.objects.create(
            pilot        = request.user,
            aircraft     = data.get('aircraft', ''),
            if_flight_id = data.get('if_flight_id', None),
            if_user_id   = data.get('if_user_id', None),
            vs_touchdown = int(data.get('vs_touchdown', 0)),
            g_force      = float(data.get('g_force', 1.0)),
            centerline   = float(data.get('centerline_dev', 0.0)),
            bounce_count = int(data.get('bounce_count', 0)),
            light_infrac = data.get('light_infractions', []),
            status       = data.get('status', 'PENDING_LOGBOOK') if data.get('if_flight_id') else data.get('status', 'LANDED'),
            score        = float(data.get('score', 0.0)),
            fuel_weight_kg      = float(data.get('fuel_weight_kg', 0.0)),
            landing_lat         = float(data.get('landing_lat', 0.0)),
            landing_lon         = float(data.get('landing_lon', 0.0)),
            ias_violations      = int(data.get('ias_violations', 0)),
            unstable_approaches = int(data.get('unstable_approaches', 0)),
            distance_from_1kft  = float(data.get('distance_from_1kft', 0.0)),
            fuel_reserve_minutes = float(data.get('fuel_reserve_minutes', 0.0)),
            has_retractable_gear = bool(data.get('has_retractable_gear', False)),
            gear_retraction_time = float(data.get('gear_retraction_time', 0.0)),
            flight_path         = data.get('flight_path', []),
            telemetry_log       = data.get('telemetry_log', []),
            deductions          = data.get('deductions', []),
        )
        return Response(
            {'id': report.id, 'score': report.score, 'status': report.status},
            status=status.HTTP_201_CREATED
        )

    def get(self, request):
        """Lista os últimos 10 relatórios do piloto autenticado."""
        reports = LandingReport.objects.filter(pilot=request.user)[:10]
        serializer = LandingReportSerializer(reports, many=True)
        return Response(serializer.data)

from rest_framework.generics import ListAPIView

class AnnouncementListView(ListAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        try:
            # Performs a hard delete on the user.
            # Due to Django's cascade deletion, all related records will be permanently destroyed.
            user.delete()
            return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import filters, viewsets
from .serializers import ChartSerializer

class ChartViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chart.objects.all().order_by('icao')
    serializer_class = ChartSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['icao', 'iata', 'name', 'city', 'country']

from django.core.management import call_command
from rest_framework.views import APIView

class TriggerSyncChartsView(APIView):
    def get(self, request):
        try:
            call_command('sync_charts')
            return Response({'status': 'success', 'message': 'Charts synced successfully.'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)
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
        b747_flights = approved_pireps.filter(aircraft__icontains='747').count()
        
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
                
        # Continentes
        continents = set()
        for icao in departures.union(arrivals):
            cont = get_continent_from_icao(icao)
            if cont and cont != 'Unknown':
                continents.add(cont)
        total_continents = len(continents)
        
        # Tours
        from .models import UserAward
        tours_completed = UserAward.objects.filter(user=request.user, progress__gte=100).count()
                
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
            elif ach.metric == 'B747_FLIGHTS': prog = b747_flights
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
            elif ach.metric == 'VA_MEMBER': prog = 0
            elif ach.metric == 'IFC_COMMENT': prog = 0
            elif ach.metric == 'CONTINENTS_VISITED': prog = total_continents
            elif ach.metric == 'TOUR_COMPLETED': prog = tours_completed
            elif ach.metric == 'ATC_OPS': prog = request.user.if_atc_ops
            elif ach.metric == 'GRADE_LEVEL': prog = request.user.if_grade
            elif ach.metric == 'TOTAL_XP': prog = request.user.if_xp
            elif ach.metric == 'TOTAL_LANDINGS': prog = request.user.if_landings
            elif ach.metric == 'TOTAL_FLIGHTS_IF': prog = request.user.if_flights
            elif ach.metric == 'BUTTER_LANDING': prog = perfect_landings
            elif ach.metric == 'NEW_VIOLATION': prog = 1 if getattr(request.user, 'has_new_violation_flag', False) else 0
            elif ach.metric == 'ON_FUMES':
                prog = 0
                for p in approved_pireps:
                    if p.planned_fuel_kg and p.fuel_used_kg:
                        remaining = float(p.planned_fuel_kg) - float(p.fuel_used_kg)
                        if remaining <= float(p.planned_fuel_kg) * 0.07:
                            prog = 1
                            break
            
            ach_data['current_progress'] = prog
            data.append(ach_data)
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def user_achievements(self, request):
        from .models import UserAchievement
        from .serializers import UserAchievementSerializer
        user_id = request.query_params.get('user')
        if user_id:
            user_achievements = UserAchievement.objects.filter(user_id=user_id)
        else:
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

    @action(detail=False, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
    def seed_db(self, request):
        try:
            import subprocess
            subprocess.Popen(['python', 'seed_achievements.py'], cwd='.')
            return Response({
                'status': 'success',
                'message': 'Script rodando em segundo plano. Aguarde 2-3 minutos!'
            })
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)

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

def get_continent_from_icao(icao):
    if not icao or len(icao) < 1: return None
    first = icao[0].upper()
    first_two = icao[:2].upper()
    
    if first == 'S': return 'South America'
    if first in ['E', 'L']: return 'Europe'
    if first in ['D', 'F', 'G', 'H']: return 'Africa'
    if first in ['C', 'K', 'M', 'T']: return 'North America'
    if first in ['O', 'R', 'U', 'V', 'Z']: return 'Asia'
    if first in ['Y', 'A', 'N']: return 'Oceania'
    if first == 'P': 
        if first_two in ['PH', 'PA', 'PG']: return 'North America'
        return 'Oceania'
    if first == 'B': return 'Europe'
    if first == 'W': return 'Asia'
    return 'Unknown'

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
    
    # Continentes
    continents = set()
    for icao in departures.union(arrivals):
        cont = get_continent_from_icao(icao)
        if cont and cont != 'Unknown':
            continents.add(cont)
    total_continents = len(continents)
    
    # Tours Completados
    from .models import UserAward
    tours_completed = UserAward.objects.filter(user=user, progress__gte=100).count()
    
    # Busca cache IF API
    if user.usernameIFC:
        import os, requests
        api_key = os.environ.get('VITE_API_KEY', '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4')
        headers = {'Authorization': f'Bearer {api_key}'}
        try:
            user_res = requests.post("https://api.infiniteflight.com/public/v2/users", 
                                     json={'discourseNames': [user.usernameIFC]}, 
                                     headers=headers, timeout=10)
            if user_res.status_code == 200:
                user_data = user_res.json()
                if user_data.get('errorCode') == 0 and user_data.get('result'):
                    res = user_data['result'][0]
                    updated_if_cache = False
                    
                    is_initial_sync = (user.if_xp == 0)
                    
                    atc = res.get('atcOperations', 0)
                    if atc != user.if_atc_ops: user.if_atc_ops = atc; updated_if_cache = True
                    
                    grade = res.get('grade', 0)
                    if grade != user.if_grade: user.if_grade = grade; updated_if_cache = True
                    
                    xp = res.get('xp', 0)
                    if xp != user.if_xp: user.if_xp = xp; updated_if_cache = True
                    
                    landings = res.get('landingCount', 0)
                    if landings != user.if_landings: user.if_landings = landings; updated_if_cache = True
                    
                    flights = res.get('flightCount', 0)
                    if flights != user.if_flights: user.if_flights = flights; updated_if_cache = True
                    
                    violations = res.get('violations', 0)
                    if not is_initial_sync and violations > user.if_violations:
                        # Evitar que todo mundo ganhe a conquista no primeiro sync após a migração
                        if user.if_violations == 0:
                            pass
                        else:
                            user.has_new_violation_flag = True
                            
                    if violations != user.if_violations: 
                        user.if_violations = violations; updated_if_cache = True
                    
                    if updated_if_cache:
                        user.save(update_fields=['if_atc_ops', 'if_grade', 'if_xp', 'if_landings', 'if_flights', 'if_violations'])
        except Exception as e:
            print(f"Error fetching IF API stats: {e}")
            
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
        elif ach.metric == 'BUTTER_LANDING':
            from .models import LandingReport
            if LandingReport.objects.filter(pilot=user, pirep__status='Approved', score=10.0).count() >= ach.target_value: unlocked = True
        elif ach.metric == 'ON_FUMES':
            for p in approved_pireps:
                if p.planned_fuel_kg and p.fuel_used_kg:
                    planned = float(p.planned_fuel_kg)
                    used = float(p.fuel_used_kg)
                    
                    if used < 1000 and planned > 1000 and (used * 1000) > (planned * 0.2) and (used * 1000) < (planned * 2.0):
                        used = used * 1000

                    remaining = planned - used
                    if remaining <= planned * 0.07:
                        unlocked = True
                        break
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
        elif ach.metric == 'VA_MEMBER':
            if user.usernameIFC:
                import os, requests
                api_key = os.environ.get('VITE_API_KEY', '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4')
                headers = {'Authorization': f'Bearer {api_key}'}
                try:
                    user_res = requests.post("https://api.infiniteflight.com/public/v2/users", 
                                             json={'discourseNames': [user.usernameIFC]}, 
                                             headers=headers, timeout=10)
                    if user_res.status_code == 200:
                        user_data = user_res.json()
                        if user_data.get('errorCode') == 0 and user_data.get('result'):
                            va = user_data['result'][0].get('virtualOrganization')
                            if va:
                                unlocked = True
                except Exception as e:
                    print(f"Error checking VA status: {e}")
        elif ach.metric == 'B747_FLIGHTS':
            if approved_pireps.filter(aircraft__icontains='747').count() >= ach.target_value: unlocked = True
        elif ach.metric == 'CONTINENTS_VISITED':
            if total_continents >= ach.target_value: unlocked = True
        elif ach.metric == 'TOUR_COMPLETED':
            if tours_completed >= ach.target_value: unlocked = True
        elif ach.metric == 'ATC_OPS':
            if user.if_atc_ops >= ach.target_value: unlocked = True
        elif ach.metric == 'GRADE_LEVEL':
            if user.if_grade >= ach.target_value: unlocked = True
        elif ach.metric == 'TOTAL_XP':
            if user.if_xp >= ach.target_value: unlocked = True
        elif ach.metric == 'TOTAL_LANDINGS':
            if user.if_landings >= ach.target_value: unlocked = True
        elif ach.metric == 'TOTAL_FLIGHTS_IF':
            if user.if_flights >= ach.target_value: unlocked = True
        elif ach.metric == 'NEW_VIOLATION':
            if getattr(user, 'has_new_violation_flag', False): unlocked = True
            
        if unlocked:
            UserAchievement.objects.create(user=user, achievement=ach)
