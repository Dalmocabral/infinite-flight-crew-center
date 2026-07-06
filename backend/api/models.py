from django.db import models
import os
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth import get_user_model
from api.choice import CHOICE_AIRCRAFT
from django.utils import timezone

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.urls import reverse

from django_rest_passwordreset.signals import reset_password_token_created
from django.utils.html import strip_tags


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is a required field')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True )
        extra_fields.setdefault('is_superuser', True )
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    email = models.EmailField(max_length=200, unique=True)
    first_name = models.CharField(max_length=200, blank=True)
    last_name = models.CharField(max_length=200, blank=True)
    usernameIFC = models.CharField(max_length=200, blank=True, null=True)
    country = models.CharField(max_length=200, blank=True)
    username = models.CharField(max_length=200, null=True, blank=True)
    is_active_pilot = models.BooleanField(default=True)
    reactivation_token = models.CharField(max_length=64, null=True, blank=True)

    objects = CustomUserManager()


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

User = get_user_model()

AIRCRAFT_CATEGORIES = [
    ('XS', 'Extra Small'),
    ('S', 'Small'),
    ('M', 'Medium'),
    ('L', 'Large'),
    ('XL', 'Extra Large'),
    ('GA', 'General Aviation'),
    ('Bizjet', 'Business Jet'),
    ('Cargo', 'Cargo'),
    ('Military', 'Military'),
    ('Uncategorized', 'Uncategorized'),
]

class Aircraft(models.Model):
    if_id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=15, choices=AIRCRAFT_CATEGORIES, default='Uncategorized')

    def __str__(self):
        return self.name

class Livery(models.Model):
    livery_id = models.UUIDField(primary_key=True)
    aircraft = models.ForeignKey(Aircraft, related_name='liveries', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.aircraft.name} - {self.name}"


class Award(models.Model):
    CHOICE_TYPE = [
        ('Tour', 'Tour'),  # Tupla (valor para o banco, valor legível)
    ]

    link_image = models.URLField(max_length=200, null=True, blank=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    type = models.CharField(max_length=5, choices=CHOICE_TYPE, default='Tour')  # Referência às escolhas
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class FlightLeg(models.Model):
    award = models.ForeignKey(Award, related_name='flight_legs', on_delete=models.CASCADE)
    from_airport = models.CharField(max_length=4)
    to_airport = models.CharField(max_length=4)
    leg_number = models.PositiveIntegerField(editable=False)  # Número da perna

    def save(self, *args, **kwargs):
        self.from_airport = self.from_airport.upper()
        self.to_airport = self.to_airport.upper()

        if not self.leg_number:  # Se for a primeira vez que está sendo salvo
            last_leg = FlightLeg.objects.filter(award=self.award).order_by('-leg_number').first()
            self.leg_number = (last_leg.leg_number + 1) if last_leg else 1  # Define o próximo número sequencial

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Leg {self.leg_number}: {self.from_airport} to {self.to_airport}"

class AllowedAircraft(models.Model):
    award = models.ForeignKey(Award, related_name='allowed_aircrafts', on_delete=models.CASCADE)
    aircraft = models.ForeignKey(Aircraft, on_delete=models.CASCADE)

    def __str__(self):
        return self.aircraft.name

class AllowedCategory(models.Model):
    award = models.ForeignKey(Award, related_name='allowed_categories', on_delete=models.CASCADE)
    category = models.CharField(max_length=15, choices=AIRCRAFT_CATEGORIES)

    def __str__(self):
        return self.category

class AllowedIcao(models.Model):
    award = models.ForeignKey(Award, related_name='allowed_icao', on_delete=models.CASCADE)
    company_icao = models.CharField(max_length=5)

    def __str__(self):
        return self.company_icao

class UserAward(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    award = models.ForeignKey(Award, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'award')

    def __str__(self):
        return f"{self.user.email} - {self.award.name}"

    def check_award_completion(self, user_flights):
        completed_flights = 0
        total_flights = self.award.flight_legs.count()

        # Coletar ICAOs permitidos, aeronaves e categorias
        allowed_icaos = set(icao.company_icao.upper() for icao in self.award.allowed_icao.all())
        allowed_aircrafts = set(allowed.aircraft.name for allowed in self.award.allowed_aircrafts.all())
        allowed_categories = set(cat.category for cat in self.award.allowed_categories.all())

        # Ordenar voos por data para consumir em ordem cronológica
        sorted_flights = sorted(user_flights, key=lambda f: f.registration_date)

        # Rastrear quais PIREPs já foram usados para não contar o mesmo voo duas vezes
        used_flight_ids = set()

        for required_flight in self.award.flight_legs.all().order_by('id'):
            for user_flight in sorted_flights:
                # Pula PIREPs já consumidos por outras pernas
                if user_flight.id in used_flight_ids:
                    continue

                if required_flight.from_airport == user_flight.departure_airport and required_flight.to_airport == user_flight.arrival_airport:
                    # Verificar se precisa checar ICAO
                    flight_icao = user_flight.flight_icao.upper() if user_flight.flight_icao else ""
                    icao_check = not allowed_icaos or flight_icao in allowed_icaos

                    # Verificar aeronave/categoria
                    has_aircraft_restriction = bool(allowed_aircrafts or allowed_categories)
                    aircraft_check = True
                    if has_aircraft_restriction:
                        aircraft_obj = Aircraft.objects.filter(name=user_flight.aircraft).first()
                        aircraft_category = aircraft_obj.category if aircraft_obj else 'Uncategorized'
                        if user_flight.aircraft in allowed_aircrafts or aircraft_category in allowed_categories:
                            aircraft_check = True
                        else:
                            aircraft_check = False

                    if icao_check and aircraft_check:
                        completed_flights += 1
                        used_flight_ids.add(user_flight.id)  # Marca como consumido
                        break

        # Calcular progresso
        if total_flights > 0:
            progress = (completed_flights / total_flights) * 100
        else:
            progress = 0

        self.progress = progress
        if progress == 100 and not self.end_date:
            self.end_date = timezone.now()
        self.save()




    def start_award(self):
        if not self.start_date:
            self.start_date = timezone.now()
            self.save()


    class PilotAward(models.Model):
        image_url = models.URLField(max_length=300, null=True, blank=True)  # Link da imagem do award
        name = models.CharField(max_length=100)  # Nome do award
        description = models.TextField()  # Descrição do award
        participants = models.ManyToManyField(User, related_name='pilot_awards', blank=True)  # Usuários participantes
        
        def __str__(self):
            return self.name
        
class PirepsFlight (models.Model):
    STATUS_CHOICES = [
        ('In Review', 'In Review'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    aircraft_choices = CHOICE_AIRCRAFT
    flight_icao =  models.CharField(max_length=10, null=True)
    flight_number = models.CharField(max_length=10)
    departure_airport = models.CharField(max_length=50)
    arrival_airport = models.CharField(max_length=50)    
    aircraft = models.CharField(max_length=100)
    pilot = models.ForeignKey(User, on_delete=models.CASCADE)
    flight_duration = models.DurationField(null=True, blank=True)     
    registration_date = models.DateTimeField(default=timezone.now)
    network = models.CharField(max_length=200, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Em análise')
    submission_type = models.CharField(max_length=20, choices=[('Manual', 'Manual'), ('Auto', 'Auto')], default='Manual')
    observation = models.TextField(max_length=500, null=True, blank=True)
    livery_id = models.UUIDField(null=True, blank=True)
    telemetry_log = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.flight_number} - {self.pilot.first_name}"


class LandingReport(models.Model):
    """Relatório de pouso capturado pelo IF Virtual Co-Pilot"""
    pilot         = models.ForeignKey(User, on_delete=models.CASCADE)
    aircraft      = models.CharField(max_length=100, blank=True)
    vs_touchdown  = models.IntegerField(default=0)       # FPM no toque
    g_force       = models.FloatField(default=1.0)       # G no impacto
    centerline    = models.FloatField(default=0.0)       # Desvio em metros
    bounce_count  = models.IntegerField(default=0)       # Quiques
    light_infrac  = models.JSONField(default=list)       # Infrações de luzes
    status        = models.CharField(max_length=20, default='WAITING')  # LANDED/CRASHED
    score         = models.FloatField(default=0.0)       # Nota 0-10
    created_at    = models.DateTimeField(auto_now_add=True)

    # Novos campos de telemetria
    if_flight_id        = models.CharField(max_length=100, blank=True, null=True)
    if_user_id          = models.CharField(max_length=100, blank=True, null=True)
    fuel_weight_kg      = models.FloatField(default=0.0, null=True, blank=True)  # Combustível no toque (kg)
    landing_lat         = models.FloatField(default=0.0, null=True, blank=True)  # Latitude do toque
    landing_lon         = models.FloatField(default=0.0, null=True, blank=True)  # Longitude do toque
    ias_violations      = models.IntegerField(default=0)  # Violações >250 KTS abaixo 10kft
    unstable_approaches = models.IntegerField(default=0)  # Aproximações instáveis <500ft
    distance_from_1kft  = models.FloatField(default=0.0, null=True, blank=True)  # Distância do toque ao aiming point (m)
    fuel_reserve_minutes = models.FloatField(default=0.0, null=True, blank=True)  # Minutos de reserva restantes
    has_retractable_gear = models.BooleanField(default=False)  # Indica se a aeronave possui trem de pouso retrátil
    gear_retraction_time = models.FloatField(default=0.0, null=True, blank=True)  # Tempo em segundos para recolher o trem após decolagem
    flight_path         = models.JSONField(default=list, blank=True)  # Trajeto do voo (lista de {lat, lon})
    telemetry_log       = models.JSONField(default=list, blank=True)  # Histórico de altitude e velocidade
    deductions          = models.JSONField(default=list, blank=True)  # Lista detalhada de penalidades aplicadas no cálculoação

    # Vínculo com o PIREP (preenchido quando o piloto submete o voo)
    pirep = models.OneToOneField(
        PirepsFlight,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='landing_report'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.pilot.email} | {self.aircraft} | {self.score}/10 | {self.created_at.strftime('%d/%m %H:%M')}"

    
class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # Novo campo

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"
    
class Announcement(models.Model):
    TAG_CHOICES = [
        ('NOTAM', 'NOTAM'),
        ('EVENTS', 'EVENTS'),
        ('WORLDTOUR', 'WORLDTOUR'),
        ('UPDATE', 'UPDATE'),
    ]
    title = models.CharField(max_length=255)
    content = models.TextField()
    tag = models.CharField(max_length=20, choices=TAG_CHOICES, default='UPDATE')
    date_posted = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_posted']

    def __str__(self):
        return self.title

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    # Defaulting to the new Vercel domain if FRONTEND_URL is not provided
    site_link = os.environ.get('FRONTEND_URL', 'https://worldtourinfinte.vercel.app/')
    if not site_link.endswith('/'):
        site_link += '/'
    full_link = f"{site_link}password_reset?token={reset_password_token.key}"

    context = {
        'full_link': full_link,
        'email': reset_password_token.user.email,
    }

    html_message = render_to_string("backend/email_template.html", context)
    plain_message = strip_tags(html_message)

    msg = EmailMultiAlternatives(
        subject=f"Password Reset Request for {reset_password_token.user.email}",
        body=plain_message,
        from_email="admin@myproject.com",
        to=[reset_password_token.user.email],
    )
    msg.attach_alternative(html_message, "text/html")
    msg.send()
