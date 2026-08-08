import os
import django
from django.db.models import Count

# Configurar o ambiente Django (se rodar standalone)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crud.settings")
django.setup()

from api.models import Achievement, UserAchievement

print("Starting achievement seed script...")

# -----------------------------------------------------
# TEMPORARY BUG FIX: Delete incorrectly awarded Bad Boy achievements
# -----------------------------------------------------
print("Resetting Bad Boy achievements...")
UserAchievement.objects.filter(achievement__metric='NEW_VIOLATION').delete()

achievements_data = [
    {
        "name": "First Flight",
        "description": "Complete your first flight.",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "TOTAL_FLIGHTS",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "Sky Veteran",
        "description": "Complete 50 flights.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "TOTAL_HOURS",
        "target_value": 50,
        "xp_reward": 2500
    },
    {
        "name": "Frequent Flyer",
        "description": "Visit 10 unique airports.",
        "category": "EXPLORATION",
        "difficulty": "SILVER",
        "metric": "TOTAL_AIRPORTS",
        "target_value": 10,
        "xp_reward": 2000
    },
    {
        "name": "Airbus Captain",
        "description": "Complete a flight with an Airbus aircraft.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "AIRBUS_FLIGHTS",
        "target_value": 1,
        "xp_reward": 600
    },
    {
        "name": "Boeing Commander",
        "description": "Complete a flight with a Boeing aircraft.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "BOEING_FLIGHTS",
        "target_value": 1,
        "xp_reward": 600
    },
    {
        "name": "Embraer Commander",
        "description": "Complete a flight with an Embraer aircraft.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "EMBRAER_FLIGHTS",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "Cessna Commander",
        "description": "Complete a flight with a Cessna aircraft.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "CESSNA_FLIGHTS",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "Pax Routine",
        "description": "Complete a Free Flight Pax.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "PAX_FLIGHTS",
        "target_value": 1,
        "xp_reward": 400
    },
    {
        "name": "Elite Freighter",
        "description": "Complete a Free Flight Cargo.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "CARGO_FLIGHTS",
        "target_value": 1,
        "xp_reward": 400
    },
    {
        "name": "World Traveler",
        "description": "Complete a World Tour flight.",
        "category": "EXPLORATION",
        "difficulty": "BRONZE",
        "metric": "WT_FLIGHTS",
        "target_value": 1,
        "xp_reward": 400
    },
    {
        "name": "Master Planner",
        "description": "Complete a flight using SimBrief.",
        "category": "OPERATIONS",
        "difficulty": "SILVER",
        "metric": "SIMBRIEF_FLIGHTS",
        "target_value": 1,
        "xp_reward": 1000
    },
    {
        "name": "Short Hop",
        "description": "Complete a short haul flight (<3 hours).",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "SHORT_HAUL",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "Crossing Continents",
        "description": "Complete a medium haul flight (3-12 hours).",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "MEDIUM_HAUL",
        "target_value": 1,
        "xp_reward": 1500
    },
    {
        "name": "Long Hauler",
        "description": "Complete a long haul flight (>12 hours).",
        "category": "PROGRESSION",
        "difficulty": "GOLD",
        "metric": "LONG_HAUL",
        "target_value": 1,
        "xp_reward": 3000
    },
    {
        "name": "Landing Master",
        "description": "Perform 10 perfect landings (10.0 score).",
        "category": "OPERATIONS",
        "difficulty": "GOLD",
        "metric": "PERFECT_LANDINGS",
        "target_value": 10,
        "xp_reward": 5000
    },
    {
        "name": "Oops...",
        "description": "Score 0.0 on a landing.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "TERRIBLE_LANDINGS",
        "target_value": 1,
        "xp_reward": 10
    },
    {
        "name": "50 Hours",
        "description": "Accumulate 50 flight hours.",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "TOTAL_HOURS",
        "target_value": 50,
        "xp_reward": 2000
    },
    {
        "name": "100 Hours",
        "description": "Accumulate 100 flight hours.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "TOTAL_HOURS",
        "target_value": 100,
        "xp_reward": 4000
    },
    {
        "name": "500 Hours",
        "description": "Accumulate 500 flight hours.",
        "category": "PROGRESSION",
        "difficulty": "GOLD",
        "metric": "TOTAL_HOURS",
        "target_value": 500,
        "xp_reward": 15000
    },
    {
        "name": "Millennial Veteran",
        "description": "Accumulate 1000 flight hours.",
        "category": "PROGRESSION",
        "difficulty": "PLATINUM",
        "metric": "TOTAL_HOURS",
        "target_value": 1000,
        "xp_reward": 50000
    },
    {
        "name": "Expert Pilot",
        "description": "Complete a flight on the Expert Server.",
        "category": "PROGRESSION",
        "difficulty": "GOLD",
        "metric": "EXPERT_SERVER",
        "target_value": 1,
        "xp_reward": 2000
    },
    {
        "name": "Training Pilot",
        "description": "Complete a flight on the Training Server.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "TRAINING_SERVER",
        "target_value": 1,
        "xp_reward": 1000
    },
    {
        "name": "Casual Pilot",
        "description": "Complete a flight on the Casual Server.",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "CASUAL_SERVER",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "Community Voice",
        "description": "Comment on the Infinite World Tour topic on the Infinite Flight Community.",
        "category": "EXPLORATION",
        "difficulty": "GOLD",
        "metric": "IFC_COMMENT",
        "target_value": 1,
        "xp_reward": 5000
    },
    {
        "name": "1 Year Anniversary",
        "description": "Fly with us for 1 year.",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "YEARS_SERVICE",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "5 Year Anniversary",
        "description": "Fly with us for 5 years.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "YEARS_SERVICE",
        "target_value": 5,
        "xp_reward": 2500
    },
    {
        "name": "10 Year Anniversary",
        "description": "Fly with us for 10 years.",
        "category": "PROGRESSION",
        "difficulty": "GOLD",
        "metric": "YEARS_SERVICE",
        "target_value": 10,
        "xp_reward": 5000
    },
    {
        "name": "15 Year Anniversary",
        "description": "Fly with us for 15 years.",
        "category": "PROGRESSION",
        "difficulty": "PLATINUM",
        "metric": "YEARS_SERVICE",
        "target_value": 15,
        "xp_reward": 10000
    },
    {
        "name": "20 Year Anniversary",
        "description": "Fly with us for 20 years.",
        "category": "PROGRESSION",
        "difficulty": "PLATINUM",
        "metric": "YEARS_SERVICE",
        "target_value": 20,
        "xp_reward": 20000
    },
    {
        "name": "Corporate Drone",
        "description": "Join an official VA/VO on the Infinite Flight Community.",
        "category": "PROGRESSION",
        "difficulty": "BRONZE",
        "metric": "VA_MEMBER",
        "target_value": 1,
        "xp_reward": 500
    },
    {
        "name": "People Person",
        "description": "Transport 5,000 passengers total.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "TOTAL_PASSENGERS",
        "target_value": 5000,
        "xp_reward": 2000
    },
    {
        "name": "Heavy Lifter",
        "description": "Transport 50,000 kg of cargo total.",
        "category": "PROGRESSION",
        "difficulty": "SILVER",
        "metric": "TOTAL_BAGGAGE",
        "target_value": 50000,
        "xp_reward": 2000
    },
    {
        "name": "Tour Completionist",
        "description": "Complete a World Tour with 100% progress.",
        "category": "EVENT",
        "difficulty": "GOLD",
        "metric": "TOUR_COMPLETED",
        "target_value": 1,
        "xp_reward": 5000
    },
    {
        "name": "Queen of the Skies",
        "description": "Complete a flight with a Boeing 747.",
        "category": "OPERATIONS",
        "difficulty": "BRONZE",
        "metric": "B747_FLIGHTS",
        "target_value": 1,
        "xp_reward": 1000
    },
    {"name": "ATC Trainee", "description": "Reach 100 ATC Operations.", "category": "PROGRESSION", "difficulty": "BRONZE", "metric": "ATC_OPS", "target_value": 100, "xp_reward": 500},
    {"name": "ATC Specialist", "description": "Reach 600 ATC Operations.", "category": "PROGRESSION", "difficulty": "SILVER", "metric": "ATC_OPS", "target_value": 600, "xp_reward": 2000},
    {"name": "ATC Veteran", "description": "Reach 1,000 ATC Operations.", "category": "PROGRESSION", "difficulty": "GOLD", "metric": "ATC_OPS", "target_value": 1000, "xp_reward": 5000},
    {"name": "ATC Legend", "description": "Reach 10,000 ATC Operations.", "category": "PROGRESSION", "difficulty": "PLATINUM", "metric": "ATC_OPS", "target_value": 10000, "xp_reward": 20000},
    {"name": "Grade 1", "description": "Reach Grade 1 in Infinite Flight.", "category": "PROGRESSION", "difficulty": "BRONZE", "metric": "GRADE_LEVEL", "target_value": 1, "xp_reward": 100},
    {"name": "Grade 2", "description": "Reach Grade 2 in Infinite Flight.", "category": "PROGRESSION", "difficulty": "BRONZE", "metric": "GRADE_LEVEL", "target_value": 2, "xp_reward": 500},
    {"name": "Grade 3", "description": "Reach Grade 3 in Infinite Flight.", "category": "PROGRESSION", "difficulty": "SILVER", "metric": "GRADE_LEVEL", "target_value": 3, "xp_reward": 1000},
    {"name": "Grade 4", "description": "Reach Grade 4 in Infinite Flight.", "category": "PROGRESSION", "difficulty": "GOLD", "metric": "GRADE_LEVEL", "target_value": 4, "xp_reward": 5000},
    {"name": "Grade 5", "description": "Reach Grade 5 in Infinite Flight.", "category": "PROGRESSION", "difficulty": "PLATINUM", "metric": "GRADE_LEVEL", "target_value": 5, "xp_reward": 10000},
    {"name": "Millionaire", "description": "Reach 1M XP in Infinite Flight.", "category": "PROGRESSION", "difficulty": "SILVER", "metric": "TOTAL_XP", "target_value": 1000000, "xp_reward": 2000},
    {"name": "Multi-Millionaire", "description": "Reach 5M XP in Infinite Flight.", "category": "PROGRESSION", "difficulty": "GOLD", "metric": "TOTAL_XP", "target_value": 5000000, "xp_reward": 10000},
    {"name": "XP Legend", "description": "Reach 10M XP in Infinite Flight.", "category": "PROGRESSION", "difficulty": "PLATINUM", "metric": "TOTAL_XP", "target_value": 10000000, "xp_reward": 20000},
    {"name": "Explorer", "description": "Visit 2 different continents.", "category": "EXPLORATION", "difficulty": "BRONZE", "metric": "CONTINENTS_VISITED", "target_value": 2, "xp_reward": 500},
    {"name": "Adventurer", "description": "Visit 3 different continents.", "category": "EXPLORATION", "difficulty": "SILVER", "metric": "CONTINENTS_VISITED", "target_value": 3, "xp_reward": 1000},
    {"name": "Seasoned Traveler", "description": "Visit 4 different continents.", "category": "EXPLORATION", "difficulty": "GOLD", "metric": "CONTINENTS_VISITED", "target_value": 4, "xp_reward": 2500},
    {"name": "World Citizen", "description": "Visit 6 different continents.", "category": "EXPLORATION", "difficulty": "PLATINUM", "metric": "CONTINENTS_VISITED", "target_value": 6, "xp_reward": 10000},
    {"name": "Frequent Lander", "description": "Reach 500 total landings.", "category": "PROGRESSION", "difficulty": "BRONZE", "metric": "TOTAL_LANDINGS", "target_value": 500, "xp_reward": 1000},
    {"name": "Master Lander", "description": "Reach 2,500 total landings.", "category": "PROGRESSION", "difficulty": "SILVER", "metric": "TOTAL_LANDINGS", "target_value": 2500, "xp_reward": 5000},
    {"name": "Landing Legend", "description": "Reach 10,000 total landings.", "category": "PROGRESSION", "difficulty": "PLATINUM", "metric": "TOTAL_LANDINGS", "target_value": 10000, "xp_reward": 20000},
    {"name": "Dedicated Pilot", "description": "Complete 1,000 total flights on IF.", "category": "PROGRESSION", "difficulty": "SILVER", "metric": "TOTAL_FLIGHTS_IF", "target_value": 1000, "xp_reward": 2500},
    {"name": "Veteran Pilot", "description": "Complete 5,000 total flights on IF.", "category": "PROGRESSION", "difficulty": "GOLD", "metric": "TOTAL_FLIGHTS_IF", "target_value": 5000, "xp_reward": 10000},
    {"name": "Legendary Pilot", "description": "Complete 10,000 total flights on IF.", "category": "PROGRESSION", "difficulty": "PLATINUM", "metric": "TOTAL_FLIGHTS_IF", "target_value": 10000, "xp_reward": 25000},
    {"name": "Butter Landing", "description": "Make a perfect landing (score 10.00).", "category": "OPERATIONS", "difficulty": "GOLD", "metric": "BUTTER_LANDING", "target_value": 1, "xp_reward": 5000},
    {"name": "Bad Boy", "description": "Received a new violation in Infinite Flight. Shame on you!", "category": "PROGRESSION", "difficulty": "BRONZE", "metric": "NEW_VIOLATION", "target_value": 1, "xp_reward": 0},
    {"name": "On Fumes", "description": "Landed with less than 7% of the planned SimBrief fuel remaining. That was close!", "category": "OPERATIONS", "difficulty": "PLATINUM", "metric": "ON_FUMES", "target_value": 1, "xp_reward": 7500}
]

created_count = 0
for ach_data in achievements_data:
    metric = ach_data['metric']
    target = ach_data['target_value']
    
    existing = Achievement.objects.filter(metric=metric, target_value=target).order_by('id')
    if existing.exists():
        first = existing.first()
        existing.exclude(id=first.id).delete()
        for key, value in ach_data.items():
            setattr(first, key, value)
        first.save()
    else:
        Achievement.objects.create(**ach_data)
        created_count += 1

print(f"Finished! {created_count} new achievements added to the database.")

from django.contrib.auth import get_user_model
from api.models import UserAchievement
from api.views import check_achievements
User = get_user_model()

print("Scanning all users to retroactively grant new achievements...")
for user in User.objects.all():
    check_achievements(user)

print("Done. (Progress and existing achievements preserved, new ones will pop up).")
