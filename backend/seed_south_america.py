import os
import sys
import django

# Forçar o Django a usar as configurações de deploy para ler a DATABASE_URL
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

print("=== RESET E CRIAÇÃO DO SOUTH AMERICA TOUR NO SUPABASE ===")
db_url = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

if not db_url:
    print("Você precisa colar a URL do banco!")
    sys.exit(1)

# Injeta as variáveis de ambiente necessárias para o Django não reclamar
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

# Inicializa o Django com o banco remoto
try:
    django.setup()
except Exception as e:
    print(f"Erro ao inicializar o Django: {e}")
    sys.exit(1)

from api.models import (
    PirepsFlight, LandingReport, UserAward, Award, 
    FlightLeg, AllowedCategory
)

print("\n[1/3] Excluindo dados antigos...")
try:
    LandingReport.objects.all().delete()
    PirepsFlight.objects.all().delete()
    UserAward.objects.all().delete()
    Award.objects.all().delete()
    print("Todos os voos, relatorios e tours antigos foram excluidos com sucesso.")
except Exception as e:
    print(f"Erro ao limpar o banco de dados: {e}")
    sys.exit(1)

print("\n[2/3] Criando South America Tour...")
tour = Award.objects.create(
    name="South America Tour",
    description="An epic journey across South America, starting and ending in Brazil. This tour is designed to test your skills to the max, featuring extremely short runways, intense winds in the deep south, and dangerous high-altitude approaches in the Andes Mountains.",
    link_image="https://i.ibb.co/RTzgmnfg/Gemini-Generated-Image-7trl947trl947trl.png",
    type="Tour"
)

# Adicionar restrição de Categoria 'Medium' (M)
AllowedCategory.objects.create(award=tour, category='M')
print("Tour criado e restricao de aeronaves Medium (A320, B738) adicionada.")

print("\n[3/3] Criando as 20 pernas...")
legs = [
    ("SBRJ", "SBSP"),  # 1. Rio to SP (Short runways)
    ("SBSP", "SBPA"),  # 2. SP to Porto Alegre
    ("SBPA", "SUMU"),  # 3. Porto Alegre to Montevideo
    ("SUMU", "SABE"),  # 4. Montevideo to Buenos Aires (Aeroparque)
    ("SABE", "SAWH"),  # 5. Buenos Aires to Ushuaia (Winds/Mountains)
    ("SAWH", "SCTE"),  # 6. Ushuaia to Puerto Montt
    ("SCTE", "SCEL"),  # 7. Puerto Montt to Santiago
    ("SCEL", "SPJC"),  # 8. Santiago to Lima
    ("SPJC", "SPZO"),  # 9. Lima to Cusco (High altitude Andes)
    ("SPZO", "SLLP"),  # 10. Cusco to La Paz (Highest int. airport 13.3k ft)
    ("SLLP", "SEQM"),  # 11. La Paz to Quito (7.9k ft)
    ("SEQM", "SKBO"),  # 12. Quito to Bogota (8.3k ft)
    ("SKBO", "SKRG"),  # 13. Bogota to Medellin (Mountains)
    ("SKRG", "SVMI"),  # 14. Medellin to Caracas
    ("SVMI", "SYCJ"),  # 15. Caracas to Georgetown
    ("SYCJ", "SOCA"),  # 16. Georgetown to Cayenne
    ("SOCA", "SBEG"),  # 17. Cayenne to Manaus (Amazon)
    ("SBEG", "SBRF"),  # 18. Manaus to Recife
    ("SBRF", "SBGL"),  # 19. Recife to Rio (Galeão)
    ("SBGL", "SBGR"),  # 20. Rio (Galeão) to SP (Guarulhos)
]

for origin, dest in legs:
    FlightLeg.objects.create(award=tour, from_airport=origin, to_airport=dest)

print(f"Todas as {len(legs)} pernas criadas com sucesso!")
print("\nProcesso concluido! O banco de dados Supabase foi atualizado.")
