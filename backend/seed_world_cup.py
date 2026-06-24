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

    # Flight Legs (48 Legs crossing all participating countries)
    legs_data = [
        # Américas (Início)
        {"departure_icao": "KLAX", "arrival_icao": "CYYZ"}, # EUA -> Canadá
        
        # Europa
        {"departure_icao": "CYYZ", "arrival_icao": "EGPF"}, # Canadá -> Escócia
        {"departure_icao": "EGPF", "arrival_icao": "ENGM"}, # Escócia -> Noruega
        {"departure_icao": "ENGM", "arrival_icao": "ESSA"}, # Noruega -> Suécia
        {"departure_icao": "ESSA", "arrival_icao": "EHAM"}, # Suécia -> Países Baixos
        {"departure_icao": "EHAM", "arrival_icao": "EGLL"}, # Países Baixos -> Inglaterra
        {"departure_icao": "EGLL", "arrival_icao": "EBBR"}, # Inglaterra -> Bélgica
        {"departure_icao": "EBBR", "arrival_icao": "LFPG"}, # Bélgica -> França
        {"departure_icao": "LFPG", "arrival_icao": "LPPT"}, # França -> Portugal
        {"departure_icao": "LPPT", "arrival_icao": "LEMD"}, # Portugal -> Espanha
        {"departure_icao": "LEMD", "arrival_icao": "LSZH"}, # Espanha -> Suíça
        {"departure_icao": "LSZH", "arrival_icao": "EDDF"}, # Suíça -> Alemanha
        {"departure_icao": "EDDF", "arrival_icao": "LOWW"}, # Alemanha -> Áustria
        {"departure_icao": "LOWW", "arrival_icao": "LKPR"}, # Áustria -> Tchéquia
        {"departure_icao": "LKPR", "arrival_icao": "LDZA"}, # Tchéquia -> Croácia
        {"departure_icao": "LDZA", "arrival_icao": "LQSA"}, # Croácia -> Bósnia
        
        # Oriente Médio / Ásia
        {"departure_icao": "LQSA", "arrival_icao": "LTFM"}, # Bósnia -> Turquia
        {"departure_icao": "LTFM", "arrival_icao": "OJAI"}, # Turquia -> Jordânia
        {"departure_icao": "OJAI", "arrival_icao": "OEJN"}, # Jordânia -> Arábia Saudita
        {"departure_icao": "OEJN", "arrival_icao": "ORBI"}, # Arábia Saudita -> Iraque
        {"departure_icao": "ORBI", "arrival_icao": "OIIE"}, # Iraque -> Irã
        {"departure_icao": "OIIE", "arrival_icao": "OTHH"}, # Irã -> Catar
        {"departure_icao": "OTHH", "arrival_icao": "UTTT"}, # Catar -> Uzbequistão
        {"departure_icao": "UTTT", "arrival_icao": "RKSI"}, # Uzbequistão -> Coreia do Sul
        {"departure_icao": "RKSI", "arrival_icao": "RJTT"}, # Coreia do Sul -> Japão
        
        # Oceania
        {"departure_icao": "RJTT", "arrival_icao": "NZAA"}, # Japão -> Nova Zelândia
        {"departure_icao": "NZAA", "arrival_icao": "YPPH"}, # Nova Zelândia -> Austrália (Perth)
        
        # África
        {"departure_icao": "YPPH", "arrival_icao": "FAOR"}, # Austrália -> África do Sul
        {"departure_icao": "FAOR", "arrival_icao": "FZAA"}, # África do Sul -> RDC
        {"departure_icao": "FZAA", "arrival_icao": "HECA"}, # RDC -> Egito
        {"departure_icao": "HECA", "arrival_icao": "DTTA"}, # Egito -> Tunísia
        {"departure_icao": "DTTA", "arrival_icao": "DAAG"}, # Tunísia -> Argélia
        {"departure_icao": "DAAG", "arrival_icao": "GMMN"}, # Argélia -> Marrocos
        {"departure_icao": "GMMN", "arrival_icao": "DGAA"}, # Marrocos -> Gana
        {"departure_icao": "DGAA", "arrival_icao": "DIAP"}, # Gana -> Costa do Marfim
        {"departure_icao": "DIAP", "arrival_icao": "GOOY"}, # Costa do Marfim -> Senegal
        {"departure_icao": "GOOY", "arrival_icao": "GVAC"}, # Senegal -> Cabo Verde
        
        # Américas (Sul e Central)
        {"departure_icao": "GVAC", "arrival_icao": "SBGR"}, # Cabo Verde -> Brasil
        {"departure_icao": "SBGR", "arrival_icao": "SUMU"}, # Brasil -> Uruguai
        {"departure_icao": "SUMU", "arrival_icao": "SAEZ"}, # Uruguai -> Argentina
        {"departure_icao": "SAEZ", "arrival_icao": "SGAS"}, # Argentina -> Paraguai
        {"departure_icao": "SGAS", "arrival_icao": "SEQM"}, # Paraguai -> Equador
        {"departure_icao": "SEQM", "arrival_icao": "SKBO"}, # Equador -> Colômbia
        {"departure_icao": "SKBO", "arrival_icao": "MPTO"}, # Colômbia -> Panamá
        {"departure_icao": "MPTO", "arrival_icao": "TNCC"}, # Panamá -> Curaçao
        {"departure_icao": "TNCC", "arrival_icao": "MTPP"}, # Curaçao -> Haiti
        {"departure_icao": "MTPP", "arrival_icao": "MMMX"}, # Haiti -> México
        {"departure_icao": "MMMX", "arrival_icao": "KEWR"}, # México -> EUA (Final)
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
