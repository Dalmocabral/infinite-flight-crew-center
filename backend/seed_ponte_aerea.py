import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

db_url = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

django.setup()

from api.models import Award, FlightLeg, AllowedCategory

def seed_tour():
    print("Criando o Tour da Ponte Aérea (King of the Bridge SBRJ-SBSP Tour)...")

    # Informações do Tour
    name = "King of the Bridge SBRJ-SBSP Tour"
    image_url = "https://i.ibb.co/Rk5yYJWC/Gemini-Generated-Image-8778k8778k8778k8.png"
    description = "The Rio-São Paulo Air Bridge is one of the most famous flight routes in Brazil. Inaugurated in 1959, it connects Santos Dumont (SBRJ) and Congonhas (SBSP) airports with fast, continuous flights. Historically operated by the legendary Electra, today it is dominated by modern narrow-body jets and advanced turboprops. In this tour, face 7 challenging legs alternating between the beautiful, short approaches in Rio and the stunning urban scenery of São Paulo!"

    award, created = Award.objects.get_or_create(
        name=name,
        defaults={
            'description': description,
            'link_image': image_url,
            'type': 'Tour'
        }
    )

    if not created:
        print(f"Tour '{name}' já existe. Atualizando descrição e imagem...")
        award.description = description
        award.link_image = image_url
        award.save()

    # Adicionar restrições de aeronaves (apenas Medium e Small, que englobam narrow-bodies e turboélices)
    AllowedCategory.objects.get_or_create(award=award, category='M')
    AllowedCategory.objects.get_or_create(award=award, category='S')
    
    print("Restrições de categoria aplicadas: 'M' (Médio / Jatos Narrow-body) e 'S' (Pequeno / Turboélices / E-Jets).")

    # Pernas do voo
    legs_data = [
        {"leg_number": 1, "departure_icao": "SBRJ", "arrival_icao": "SBSP"},
        {"leg_number": 2, "departure_icao": "SBSP", "arrival_icao": "SBRJ"},
        {"leg_number": 3, "departure_icao": "SBRJ", "arrival_icao": "SBSP"},
        {"leg_number": 4, "departure_icao": "SBSP", "arrival_icao": "SBRJ"},
        {"leg_number": 5, "departure_icao": "SBRJ", "arrival_icao": "SBSP"},
        {"leg_number": 6, "departure_icao": "SBSP", "arrival_icao": "SBRJ"},
        {"leg_number": 7, "departure_icao": "SBRJ", "arrival_icao": "SBSP"},
    ]

    # Limpar pernas antigas caso existam e recriar
    award.flight_legs.all().delete()

    for leg in legs_data:
        FlightLeg.objects.create(
            award=award,
            from_airport=leg["departure_icao"],
            to_airport=leg["arrival_icao"]
        )
        print(f"Adicionada perna {leg['leg_number']}: {leg['departure_icao']} -> {leg['arrival_icao']}")

    print("Tour da Ponte Aérea criado com sucesso!")

if __name__ == "__main__":
    seed_tour()
