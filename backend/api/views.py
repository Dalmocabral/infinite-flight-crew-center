from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from django.contrib.auth import get_user_model, authenticate
from django.db.models import Sum, Count
from django.http import HttpResponse
from django.utils import timezone

from knox.models import AuthToken
from datetime import timedelta

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
                _, token = AuthToken.objects.create(user)

                return Response(
                    {
                        'user': self.serializer_class(user).data,
                        'token': token
                    }
                )
            else:
                return Response({'error': 'Invalid credentia'}, status=401)
        
        else:
            return Response(serializer.errors, status=400)
        
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]  # Permite acesso sem autenticação
    serializer_class = UserSerializer  # Use o UserSerializer aqui
    queryset = User.objects.all()

    def list(self, request):
        queryset = User.objects.all()
        serializer = self.serializer_class(queryset, many=True)  # Serializa os dados dos usuários
        return Response(serializer.data)
    
class PirepsFlightViewset(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PirepsFlightSerializer
    queryset = PirepsFlight.objects.all()

    def perform_create(self, serializer):
        serializer.save(pilot=self.request.user, status="In Review")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pilot != request.user:
            raise PermissionDenied("Você não tem permissão para editar este PIREP.")
        if instance.status != "In Review":
            return Response(
                {"detail": "Este PIREP não pode ser editado porque não está em análise."},
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
            PirepsFlight.objects.filter(status="Approved")
            .values("pilot__first_name", "pilot__last_name", "pilot__country")
            .annotate(total_duration=Sum("flight_duration"))
            .order_by("-total_duration")[:5]
        )

        # Top 5 Total de Voos
        top_flights = (
            PirepsFlight.objects.filter(status="Approved")
            .values("pilot__first_name", "pilot__last_name", "pilot__country")
            .annotate(total_flights=Count("id"))
            .order_by("-total_flights")[:5]
        )

        return Response({
            "top_duration": list(top_duration),
            "top_flights": list(top_flights),
        })
    
class AwardViewSet(viewsets.ModelViewSet):
    queryset = Award.objects.all()
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
        return Response({"status": "Notificação marcada como lida"}, status=status.HTTP_200_OK)
    
class UserDetailViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def retrieve(self, request, pk=None):
        try:
            user = CustomUser.objects.get(id=pk)  # Busca o usuário pelo ID
            serializer = UserSerializer(user)  # Serializa os dados do usuário
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
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
                total_duration=Sum('flight_duration')
            )

            metrics_30_days = approved_pireps_last_30_days.aggregate(
                total_flights=Count('id'),
                total_duration=Sum('flight_duration')
            )

            # --- Extract Values ---
            total_flights = metrics_all_time['total_flights'] or 0
            total_duration = metrics_all_time['total_duration'] or timedelta(0)

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
                flights_data.append({
                    "id": flight.id,
                    "flight": flight.flight_number,
                    "dep": flight.departure_airport,
                    "arr": flight.arrival_airport,
                    "date": flight.registration_date,
                    "network": flight.network,
                    "duration": flight.flight_duration,
                    "aircraft": flight.aircraft,
                    "status": flight.status,
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

        return Response({
            "total_flights": total_flights,
            "total_hours": round(total_hours, 2),
            "total_pilots": total_pilots,
            "total_airports": total_airports
        })

class ValidateTokenView(APIView):
    permission_classes = [IsAuthenticated]  # Apenas usuários autenticados podem acessar

    def get(self, request):
        # Se o token for válido, o usuário já está autenticado
        return Response({"message": "Token válido"}, status=status.HTTP_200_OK)


def test_email(request):
    send_welcome_email("destinatario@email.com")
    return HttpResponse("E-mail enviado com sucesso!")