import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Award, FlightLeg, Aircraft, AllowedAircraft

def seed():
    # Create the award
    tour, created = Award.objects.get_or_create(
        name="Tour do Brasil (Teste GA)",
        defaults={
            "description": "Um World Tour de teste focado em General Aviation (GA). São 5 pernas voando pelo litoral e capitais do Brasil.",
            "link_image": "https://images.unsplash.com/photo-1596395819057-e37f55a8516b?q=80&w=800&auto=format&fit=crop",
            "type": "Tour",
        }
    )

    if created:
        # Create 5 legs in Brazil
        legs = [
            ("SBGR", "SBRJ"),
            ("SBRJ", "SBCF"),
            ("SBCF", "SBSV"),
            ("SBSV", "SBRF"),
            ("SBRF", "SBFZ"),
        ]
        
        # O modelo FlightLeg já lida com leg_number no save(), mas passamos pra garantir
        for i, (orig, dest) in enumerate(legs, start=1):
            FlightLeg.objects.create(
                award=tour,
                from_airport=orig,
                to_airport=dest
            )
            
        # Create GA Aircraft
        c172, _ = Aircraft.objects.get_or_create(
            name="Cessna 172",
            defaults={
                "if_id": uuid.uuid4(),
                "category": "GA"
            }
        )
        tbm930, _ = Aircraft.objects.get_or_create(
            name="TBM-930",
            defaults={
                "if_id": uuid.uuid4(),
                "category": "GA"
            }
        )
        
        AllowedAircraft.objects.get_or_create(award=tour, aircraft=c172)
        AllowedAircraft.objects.get_or_create(award=tour, aircraft=tbm930)
        
        print("World Tour criado com sucesso!")
        print("Aeronaves GA (C172 e TBM-930) permitidas.")
    else:
        print("O Tour já havia sido criado.")

if __name__ == '__main__':
    seed()
