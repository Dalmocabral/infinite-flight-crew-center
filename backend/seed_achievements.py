import os
import django

# Configure Django settings (adjust if your production settings module is different)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Achievement

achievements_data = [
    # Aeronaves
    {'name': 'Embraer Captain', 'description': 'Complete your first flight in an Embraer.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'EMBRAER_FLIGHTS', 'target_value': 1, 'xp_reward': 200},
    {'name': 'Cessna Captain', 'description': 'Complete your first flight in a Cessna.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'CESSNA_FLIGHTS', 'target_value': 1, 'xp_reward': 200},
    
    # Tipos de Voo
    {'name': 'Pax Routine', 'description': 'Complete 5 passenger flights.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'PAX_FLIGHTS', 'target_value': 5, 'xp_reward': 1000},
    {'name': 'Elite Freighter', 'description': 'Complete 5 cargo flights.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'CARGO_FLIGHTS', 'target_value': 5, 'xp_reward': 1000},
    {'name': 'World Traveler', 'description': 'Participate in a World Tour flight.', 'category': 'EVENT', 'difficulty': 'SILVER', 'metric': 'WT_FLIGHTS', 'target_value': 1, 'xp_reward': 1500},
    
    # SimBrief
    {'name': 'Master Planner', 'description': 'Complete a flight using SimBrief data.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'SIMBRIEF_FLIGHTS', 'target_value': 1, 'xp_reward': 500},
    
    # Duração
    {'name': 'Puddle Jumper', 'description': 'Complete a short-haul flight (<3h).', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'SHORT_HAUL', 'target_value': 1, 'xp_reward': 300},
    {'name': 'Continent Crosser', 'description': 'Complete a medium-haul flight (3 to 12h).', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'MEDIUM_HAUL', 'target_value': 1, 'xp_reward': 800},
    {'name': 'Long Haul', 'description': 'Complete an ultra long-haul flight (>12h).', 'category': 'SKILL', 'difficulty': 'GOLD', 'metric': 'LONG_HAUL', 'target_value': 1, 'xp_reward': 2500},
    
    # Pousos
    {'name': 'Landing Master', 'description': 'Achieve 10 consecutive perfect landings (10.0 score).', 'category': 'SKILL', 'difficulty': 'PLATINUM', 'metric': 'PERFECT_LANDINGS', 'target_value': 10, 'xp_reward': 5000},
    {'name': 'Oof...', 'description': 'Score a terrible landing (0.0). It happens to the best of us.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'TERRIBLE_LANDINGS', 'target_value': 1, 'xp_reward': 50},
    
    # Servidores
    {'name': 'Elite Pilot', 'description': 'Complete your first flight on the Expert Server.', 'category': 'PROGRESSION', 'difficulty': 'GOLD', 'metric': 'EXPERT_SERVER', 'target_value': 1, 'xp_reward': 1000},
    {'name': 'In Training', 'description': 'Complete your first flight on the Training Server.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'TRAINING_SERVER', 'target_value': 1, 'xp_reward': 100},
    {'name': 'Sunday Flyer', 'description': 'Complete your first flight on the Casual Server.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'CASUAL_SERVER', 'target_value': 1, 'xp_reward': 100},
    
    # Comunidade e Aniversário
    {'name': '1 Year Anniversary', 'description': 'Fly with us for 1 year.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'YEARS_SERVICE', 'target_value': 1, 'xp_reward': 500},
    {'name': '5 Year Anniversary', 'description': 'Fly with us for 5 years.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'YEARS_SERVICE', 'target_value': 5, 'xp_reward': 2500},
    {'name': '10 Year Anniversary', 'description': 'Fly with us for 10 years.', 'category': 'PROGRESSION', 'difficulty': 'GOLD', 'metric': 'YEARS_SERVICE', 'target_value': 10, 'xp_reward': 5000},
    {'name': '15 Year Anniversary', 'description': 'Fly with us for 15 years.', 'category': 'PROGRESSION', 'difficulty': 'PLATINUM', 'metric': 'YEARS_SERVICE', 'target_value': 15, 'xp_reward': 10000},
    {'name': '20 Year Anniversary', 'description': 'Fly with us for 20 years.', 'category': 'PROGRESSION', 'difficulty': 'PLATINUM', 'metric': 'YEARS_SERVICE', 'target_value': 20, 'xp_reward': 20000},
    
    # VA/VO
    {'name': 'Corporate Drone', 'description': 'Join an official VA/VO on the Infinite Flight Community.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'VA_MEMBER', 'target_value': 1, 'xp_reward': 500}
]

created_count = 0
for ach_data in achievements_data:
    obj, created = Achievement.objects.get_or_create(
        name=ach_data['name'], 
        defaults=ach_data
    )
    # se não criou, atualiza o texto para inglês caso estivesse em português
    if not created:
        obj.description = ach_data['description']
        obj.save()
    else:
        created_count += 1
        print(f"Created: {ach_data['name']}")

print(f"Finished! {created_count} new achievements added to the database.")

from django.contrib.auth import get_user_model
from api.models import UserAchievement
from api.views import check_achievements
User = get_user_model()

print("Scanning all users to retroactively grant new achievements...")
for user in User.objects.all():
    check_achievements(user)

updated = UserAchievement.objects.filter(viewed=True).update(viewed=False)
print(f"Done. {updated} achievements marked as unread to show animations.")
