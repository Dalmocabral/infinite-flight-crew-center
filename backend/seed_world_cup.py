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
    description = "Celebrate the greatest football tournament on Earth! The 2026 World Cup is jointly hosted by the USA, Canada, and Mexico. In this exciting tour, you will fly across the North American continent, visiting the incredible host cities. Starting from Dallas, you will head down to the high altitudes of Mexico City, up the Pacific coast to San Francisco and Vancouver, across to Toronto, down south to Atlanta and Miami, and finally arriving at Newark, New Jersey—the location of the grand final match! Medium and Heavy jets are allowed for these long domestic and international hops."

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

    # Flight Legs (Dallas -> Mexico City -> SF -> Vancouver -> Toronto -> Atlanta -> Miami -> New York/Newark)
    legs_data = [
        {"departure_icao": "KDFW", "arrival_icao": "MMMX"}, # Dallas to Mexico City
        {"departure_icao": "MMMX", "arrival_icao": "KSFO"}, # Mexico City to San Francisco
        {"departure_icao": "KSFO", "arrival_icao": "CYVR"}, # San Francisco to Vancouver
        {"departure_icao": "CYVR", "arrival_icao": "CYYZ"}, # Vancouver to Toronto
        {"departure_icao": "CYYZ", "arrival_icao": "KATL"}, # Toronto to Atlanta
        {"departure_icao": "KATL", "arrival_icao": "KMIA"}, # Atlanta to Miami
        {"departure_icao": "KMIA", "arrival_icao": "KEWR"}, # Miami to Newark (Final)
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
