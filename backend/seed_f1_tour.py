import os
import sys
import django

# Forçar o Django a usar as configurações de deploy para ler a DATABASE_URL
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

print("=== CRIAÇÃO DO WORLD TOUR FORMULA 1 NO SUPABASE ===")
# DB URL com %40 em vez de @ na senha
db_url = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

# Inicializa o Django
try:
    django.setup()
except Exception as e:
    print(f"Erro ao inicializar o Django: {e}")
    sys.exit(1)

from api.models import Award, FlightLeg, AllowedCategory

print("[0/2] Limpando tour F1 anterior (se houver)...")
Award.objects.filter(name="World Tour Formula 1").delete()

print("[1/2] Criando World Tour Formula 1...")
tour = Award.objects.create(
    name="World Tour Formula 1",
    description="Take on the role of the official F1 Cargo Transport! Fly the massive Boeing 747-8F, 747-400F, and 777F to deliver the cars, equipment, and teams to every race on the official Formula 1 calendar. This tour includes realistic technical fuel stops in Anchorage (PANC) and Leipzig (EDDP) to handle the long intercontinental jumps with heavy cargo.",
    link_image="https://i.ibb.co/yF8zrFKk/Gemini-Generated-Image-5339dt5339dt5339.png",
    type="Tour"
)

# Restringir para Heavy/Cargo (H)
AllowedCategory.objects.create(award=tour, category='H')
print("Tour criado e restricao de aeronaves Heavy (H) adicionada.")

print("\n[2/2] Criando as 26 pernas logísticas...")
legs = [
    ("OBBI", "OEJN"),  # Bahrain to Saudi Arabia
    ("OEJN", "WMKK"),  # Saudi Arabia to Malaysia (Logistical Fuel Stop!)
    ("WMKK", "YMML"),  # Malaysia to Australia
    ("YMML", "RJGG"),  # Australia to Japan
    ("RJGG", "ZSPD"),  # Japan to China
    ("ZSPD", "PANC"),  # China to Alaska (Logistical Fuel Stop for Heavy Cargo)
    ("PANC", "KMIA"),  # Alaska to Miami
    ("KMIA", "LIPE"),  # Miami to Imola
    ("LIPE", "LFMN"),  # Imola to Monaco (Nice)
    ("LFMN", "CYUL"),  # Monaco to Montreal
    ("CYUL", "LEBL"),  # Montreal to Barcelona
    ("LEBL", "LOWW"),  # Barcelona to Austria (Vienna)
    ("LOWW", "EGLL"),  # Austria to Silverstone (London)
    ("EGLL", "LHBP"),  # London to Hungary
    ("LHBP", "EBBR"),  # Hungary to Spa (Brussels)
    ("EBBR", "EHAM"),  # Spa to Zandvoort (Amsterdam)
    ("EHAM", "LIMC"),  # Amsterdam to Monza (Milan)
    ("LIMC", "UBBB"),  # Monza to Baku
    ("UBBB", "WSSS"),  # Baku to Singapore
    ("WSSS", "PANC"),  # Singapore to Alaska (Logistical Fuel Stop)
    ("PANC", "KAUS"),  # Alaska to Austin
    ("KAUS", "MMMX"),  # Austin to Mexico City
    ("MMMX", "SBGR"),  # Mexico City to Interlagos (Guarulhos)
    ("SBGR", "KLAS"),  # Guarulhos to Las Vegas
    ("KLAS", "EDDP"),  # Las Vegas to Leipzig (DHL European Hub - Fuel Stop)
    ("EDDP", "OTHH"),  # Leipzig to Qatar
    ("OTHH", "OMAA"),  # Qatar to Abu Dhabi
]

for origin, dest in legs:
    FlightLeg.objects.create(award=tour, from_airport=origin, to_airport=dest)

print(f"Todas as {len(legs)} pernas criadas com sucesso!")
print("\nProcesso concluido! O banco de dados Supabase foi atualizado.")
