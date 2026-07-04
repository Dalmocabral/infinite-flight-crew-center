from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import PirepsFlight, UserAward, FlightLeg, Notification, Award, User

@receiver(post_save, sender=PirepsFlight)
def update_user_award_on_pirep_approval(sender, instance, **kwargs):
    """
    Signal para atualizar o progresso do UserAward quando um PirepsFlight é aprovado.
    """
    # Verifica se o status do PirepsFlight foi alterado para "Approved"
    if instance.status == 'Approved':
        # Obtém o usuário associado ao PirepsFlight
        user = instance.pilot

        # Obtém o aeroporto de partida e chegada do PirepsFlight
        departure_airport = instance.departure_airport
        arrival_airport = instance.arrival_airport

        # Verifica se o voo corresponde a uma FlightLeg de algum Award
        flight_legs = FlightLeg.objects.filter(
            from_airport=departure_airport,
            to_airport=arrival_airport
        )

        # Para cada FlightLeg encontrada, verifica o Award correspondente
        for flight_leg in flight_legs:
            award = flight_leg.award

            # Verifica se já existe um UserAward para o usuário e o Award
            user_award, created = UserAward.objects.get_or_create(
                user=user,
                award=award,
                defaults={'progress': 0, 'start_date': timezone.now()}  # Define o progresso inicial como 0 e a data de início
            )

            # Se o UserAward já existia e não tinha uma data de início, define a data de início
            if not created and not user_award.start_date:
                user_award.start_date = timezone.now()
                user_award.save()

            # Obtém todos os voos aprovados do usuário
            user_flights = PirepsFlight.objects.filter(pilot=user, status='Approved')

            # Atualiza o progresso do UserAward
            user_award.check_award_completion(user_flights)

@receiver(post_save, sender=PirepsFlight)
def notify_pilot_on_status_change(sender, instance, **kwargs):
    message = None  # Inicializa a variável para evitar erro

    if instance.status == "Approved":
        message = f"🥳🎉🛬 Your flight {instance.flight_icao} {instance.flight_number} has been approved!"
    elif instance.status == "Rejected":
        message = f"❌ Your flight {instance.flight_icao} {instance.flight_number} has been rejected."

    if message:  # Apenas cria notificação se 'message' foi definido
        if not Notification.objects.filter(recipient=instance.pilot, message=message).exists():
            Notification.objects.create(
                recipient=instance.pilot,
                message=message
            )

@receiver(post_save, sender=Award)
def notify_all_users_on_award_creation(sender, instance, **kwargs):
    users = User.objects.all()  # Pega todos os usuários do sistema

    for user in users:
        message = f"🏆 A new World Tour has been created: '{instance.name}'!"

        # Evita criar notificações duplicadas do mesmo Award para o mesmo usuário
        if not Notification.objects.filter(recipient=user, message=message).exists():
            Notification.objects.create(
                recipient=user,
                message=message
            )