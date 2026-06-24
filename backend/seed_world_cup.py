import os
import sys
import django

# Force Django to use deployment settings to read DATABASE_URL
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

# Supabase URL used previously
db_url = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

django.setup()

from api.models import Award, FlightLeg, AllowedCategory

def seed_world_cup_tour():
    print("Creating the 2026 World Cup Tour...")

    name = "2026 World Cup Tour"
    image_url = "https://i.ibb.co/qVt4rdX/Gemini-Generated-Image-l42bj0l42bj0l42b.png"
    
    # Description in English
    description = "Celebrate the greatest football tournament on Earth! The 2026 World Cup unites the globe in a spectacular display of passion and skill. In this epic 15-leg intercontinental journey, you will fly across the world, connecting major participating nations and legendary former champions. Starting in Los Angeles, you'll cross the Pacific to Asia and Oceania, head over to the Middle East and Africa, soar through Europe's football capitals, and sweep down to South America before heading back north. Your ultimate destination is Newark, New Jersey—the very stadium where the grand final will take place. Fire up your long-haul jets and let the games begin!"

    award, created = Award.objects.get_or_create(
        name=name,
        defaults={
            'description': description,
            'link_image': image_url,
            'type': 'Tour'
        }
    )

    if not created:
        print(f"Tour '{name}' already exists. Updating description and image...")
        award.description = description
        award.link_image = image_url
        award.save()

    # Allowed Aircraft Categories (Medium, Large, Extra Large)
    AllowedCategory.objects.get_or_create(award=award, category='M')
    AllowedCategory.objects.get_or_create(award=award, category='L')
    AllowedCategory.objects.get_or_create(award=award, category='XL')
    AllowedCategory.objects.get_or_create(award=award, category='Bizjet')
    
    print("Category restrictions applied: 'M', 'L', 'XL', 'Bizjet'.")

    # Flight Legs (15 Legs crossing the globe)
    legs_data = [
        {"departure_icao": "KLAX", "arrival_icao": "CYVR"}, # USA -> Canada
        {"departure_icao": "CYVR", "arrival_icao": "RJTT"}, # Canada -> Japan
        {"departure_icao": "RJTT", "arrival_icao": "RKSI"}, # Japan -> South Korea
        {"departure_icao": "RKSI", "arrival_icao": "YSSY"}, # South Korea -> Australia
        {"departure_icao": "YSSY", "arrival_icao": "OTHH"}, # Australia -> Qatar
        {"departure_icao": "OTHH", "arrival_icao": "GOOY"}, # Qatar -> Senegal
        {"departure_icao": "GOOY", "arrival_icao": "LEMD"}, # Senegal -> Spain
        {"departure_icao": "LEMD", "arrival_icao": "LFPG"}, # Spain -> France
        {"departure_icao": "LFPG", "arrival_icao": "EGLL"}, # France -> England
        {"departure_icao": "EGLL", "arrival_icao": "EDDF"}, # England -> Germany
        {"departure_icao": "EDDF", "arrival_icao": "LIRF"}, # Germany -> Italy
        {"departure_icao": "LIRF", "arrival_icao": "SAEZ"}, # Italy -> Argentina
        {"departure_icao": "SAEZ", "arrival_icao": "SBGR"}, # Argentina -> Brazil
        {"departure_icao": "SBGR", "arrival_icao": "MMMX"}, # Brazil -> Mexico
        {"departure_icao": "MMMX", "arrival_icao": "KEWR"}, # Mexico -> USA Final
    ]

    # Clear old legs if any and recreate
    award.flight_legs.all().delete()

    for leg in legs_data:
        FlightLeg.objects.create(
            award=award,
            from_airport=leg["departure_icao"],
            to_airport=leg["arrival_icao"]
        )
        print(f"Added leg: {leg['departure_icao']} -> {leg['arrival_icao']}")

    print("2026 World Cup Tour successfully created!")

if __name__ == "__main__":
    seed_world_cup_tour()
