import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')
os.environ['DATABASE_URL'] = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
django.setup()

from api.models import Award, Aircraft, AllowedAircraft, AllowedCategory

f1_tour = Award.objects.filter(name="World Tour Formula 1").first()

if not f1_tour:
    print("Tour not found!")
    exit(1)

# Limpar restricoes antigas (como a restrição genérica "Heavy")
AllowedCategory.objects.filter(award=f1_tour).delete()
AllowedAircraft.objects.filter(award=f1_tour).delete()

print("Adicionando restricoes rigorosas de aeronaves...")
# Aviões de carga pesada exatos que estão no Infinite Flight
allowed_names = [
    "Boeing 777F",
    "Boeing 747-8",
    "Boeing 747-400",
    "MD-11F",
    "Airbus A330-200F"
]

for name in allowed_names:
    aircraft = Aircraft.objects.filter(name=name).first()
    if aircraft:
        AllowedAircraft.objects.create(award=f1_tour, aircraft=aircraft)
        print(f"Adicionado: {name}")

# Atualizar descrição com o alerta rigoroso
f1_tour.description = "Take on the role of the official F1 Cargo Transport! ⚠️ STRICT REQUIREMENT: You MUST fly one of the approved heavy cargo aircraft (Boeing 777F, Boeing 747-8, Boeing 747-400, MD-11F, or Airbus A330-200F) to deliver the cars and equipment to every race on the official Formula 1 calendar. Flights logged with any other aircraft will NOT be accepted! This tour includes realistic technical fuel stops in Anchorage (PANC) and Leipzig (EDDP) to handle the long intercontinental jumps."
f1_tour.save()

print("\nFeito! Restricoes aplicadas e descricao atualizada no Supabase.")
