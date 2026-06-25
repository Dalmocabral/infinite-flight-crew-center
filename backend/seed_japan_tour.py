import os
import django
from django.db import transaction

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

db_url = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

django.setup()

from api.models import Award, FlightLeg, AllowedCategory

def run():
    print("Creating the Tour Japan...")

    # Tour Information
    name = "Tour Japan"
    image_url = "https://i.ibb.co/Z1bvVT2C/Sem-T-tulo-1.png"
    
    # Description in English
    description = "Discover the Land of the Rising Sun! This 7-leg journey takes you from the tropical islands of Okinawa all the way to the snowy peaks of Hokkaido. Experience breathtaking approaches, island-hopping, and a spectacular scenic flyby of the iconic Mount Fuji as you travel between Osaka and Tokyo. Prepare your narrow-body jets and embrace the beauty of Japan!"

    award, created = Award.objects.get_or_create(
        name=name,
        defaults={'description': description, 'type': 'Tour', 'link_image': image_url}
    )

    if not created:
        print(f"Tour '{name}' already exists. Updating description and image...")
        award.description = description
        award.link_image = image_url
        award.save()

    # Allowed categories: M (Medium) and S (Small)
    allowed_categories = ['M', 'S']
    for cat in allowed_categories:
        cat_obj, _ = AllowedCategory.objects.get_or_create(award=award, category=cat)
    
    print("Category restrictions applied: 'M' (Narrow-body) and 'S' (Regional).")

    # Flight Legs (7 Legs crossing Japan South to North)
    legs_data = [
        {"departure_icao": "ROAH", "arrival_icao": "RJFF"}, # Okinawa -> Fukuoka
        {"departure_icao": "RJFF", "arrival_icao": "RJOA"}, # Fukuoka -> Hiroshima
        {"departure_icao": "RJOA", "arrival_icao": "RJBB"}, # Hiroshima -> Osaka
        {"departure_icao": "RJBB", "arrival_icao": "RJTT"}, # Osaka -> Tokyo (Passes Mount Fuji)
        {"departure_icao": "RJTT", "arrival_icao": "RJSS"}, # Tokyo -> Sendai
        {"departure_icao": "RJSS", "arrival_icao": "RJCH"}, # Sendai -> Hakodate
        {"departure_icao": "RJCH", "arrival_icao": "RJCC"}, # Hakodate -> Sapporo
    ]

    # Clear old legs if any and recreate
    with transaction.atomic():
        FlightLeg.objects.filter(award=award).delete()
        
        for leg in legs_data:
            FlightLeg.objects.create(
                award=award,
                from_airport=leg["departure_icao"],
                to_airport=leg["arrival_icao"]
            )
            print(f"Added leg: {leg['departure_icao']} -> {leg['arrival_icao']}")

    print("Tour Japan successfully created!")

if __name__ == '__main__':
    run()
