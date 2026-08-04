import os
import django

# Configure Django settings (adjust if your production settings module is different)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Achievement

achievements_data = [
    # Aeronaves
    {'name': 'Comandante Embraer', 'description': 'Faça seu primeiro voo com um Embraer.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'EMBRAER_FLIGHTS', 'target_value': 1, 'xp_reward': 200},
    {'name': 'Comandante Cessna', 'description': 'Faça seu primeiro voo com um Cessna.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'CESSNA_FLIGHTS', 'target_value': 1, 'xp_reward': 200},
    
    # Tipos de Voo
    {'name': 'Rotina de Pax', 'description': 'Complete 5 voos de passageiros.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'PAX_FLIGHTS', 'target_value': 5, 'xp_reward': 1000},
    {'name': 'Cargueiro de Elite', 'description': 'Complete 5 voos cargueiros.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'CARGO_FLIGHTS', 'target_value': 5, 'xp_reward': 1000},
    {'name': 'Viajante do Mundo', 'description': 'Participe do World Tour (1 voo).', 'category': 'EVENT', 'difficulty': 'SILVER', 'metric': 'WT_FLIGHTS', 'target_value': 1, 'xp_reward': 1500},
    
    # SimBrief
    {'name': 'Planejamento Mestre', 'description': 'Voe utilizando dados do SimBrief.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'SIMBRIEF_FLIGHTS', 'target_value': 1, 'xp_reward': 500},
    
    # Duração
    {'name': 'Pulo de Pulga', 'description': 'Faça um voo de curta duração (<3h).', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'SHORT_HAUL', 'target_value': 1, 'xp_reward': 300},
    {'name': 'Cruzando o Continente', 'description': 'Faça um voo de média duração (3 a 12h).', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'MEDIUM_HAUL', 'target_value': 1, 'xp_reward': 800},
    {'name': 'Longo Curso', 'description': 'Faça um voo ultra-longo (>12h).', 'category': 'SKILL', 'difficulty': 'GOLD', 'metric': 'LONG_HAUL', 'target_value': 1, 'xp_reward': 2500},
    
    # Pousos
    {'name': 'Mestre do Pouso', 'description': 'Consiga 10 pousos perfeitos consecutivos (10.0).', 'category': 'SKILL', 'difficulty': 'PLATINUM', 'metric': 'PERFECT_LANDINGS', 'target_value': 10, 'xp_reward': 5000},
    {'name': 'Deu Ruim...', 'description': 'Consiga um pouso péssimo (0.0). Acontece nas melhores famílias.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'TERRIBLE_LANDINGS', 'target_value': 1, 'xp_reward': 50},
    
    # Servidores
    {'name': 'Piloto de Elite', 'description': 'Faça seu primeiro voo no Expert Server.', 'category': 'PROGRESSION', 'difficulty': 'GOLD', 'metric': 'EXPERT_SERVER', 'target_value': 1, 'xp_reward': 1000},
    {'name': 'Em Treinamento', 'description': 'Faça seu primeiro voo no Training Server.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'TRAINING_SERVER', 'target_value': 1, 'xp_reward': 100},
    {'name': 'Domingueiro', 'description': 'Faça seu primeiro voo no Casual Server.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'CASUAL_SERVER', 'target_value': 1, 'xp_reward': 100},
    
    # Comunidade e Aniversário
    {'name': '1 Year Anniversary', 'description': 'Voe conosco por 1 ano.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'YEARS_SERVICE', 'target_value': 1, 'xp_reward': 500},
    {'name': '5 Year Anniversary', 'description': 'Voe conosco por 5 anos.', 'category': 'PROGRESSION', 'difficulty': 'SILVER', 'metric': 'YEARS_SERVICE', 'target_value': 5, 'xp_reward': 2500},
    {'name': '10 Year Anniversary', 'description': 'Voe conosco por 10 anos.', 'category': 'PROGRESSION', 'difficulty': 'GOLD', 'metric': 'YEARS_SERVICE', 'target_value': 10, 'xp_reward': 5000},
    {'name': '15 Year Anniversary', 'description': 'Voe conosco por 15 anos.', 'category': 'PROGRESSION', 'difficulty': 'PLATINUM', 'metric': 'YEARS_SERVICE', 'target_value': 15, 'xp_reward': 10000},
    {'name': '20 Year Anniversary', 'description': 'Voe conosco por 20 anos.', 'category': 'PROGRESSION', 'difficulty': 'PLATINUM', 'metric': 'YEARS_SERVICE', 'target_value': 20, 'xp_reward': 20000},
    
    # VA/VO
    {'name': 'Corporate Drone', 'description': 'Junte-se a uma VA/VO oficial no Infinite Flight.', 'category': 'PROGRESSION', 'difficulty': 'BRONZE', 'metric': 'VA_MEMBER', 'target_value': 1, 'xp_reward': 500}
]

created_count = 0
for ach_data in achievements_data:
    obj, created = Achievement.objects.get_or_create(
        name=ach_data['name'], 
        defaults=ach_data
    )
    if created:
        created_count += 1
        print(f"Criado: {ach_data['name']}")
    else:
        print(f"Já existe: {ach_data['name']}")

print(f"Finalizado! {created_count} novas conquistas adicionadas ao banco de dados.")
