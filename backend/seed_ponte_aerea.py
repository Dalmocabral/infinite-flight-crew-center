import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Award, FlightLeg, AllowedCategory

def seed_tour():
    print("Criando o Tour da Ponte Aérea (King of the Bridge SBRJ-SBSP Tour)...")

    # Informações do Tour
    name = "King of the Bridge SBRJ-SBSP Tour"
    image_url = "https://i.ibb.co/Rk5yYJWC/Gemini-Generated-Image-8778k8778k8778k8.png"
    description = """<p><strong>A História da Famosa Ponte Aérea Rio-São Paulo</strong></p>
<p>A Ponte Aérea Rio-São Paulo é uma das rotas comerciais mais movimentadas e famosas do mundo. Inaugurada em 5 de julho de 1959 pelas companhias aéreas Varig, Cruzeiro do Sul e VASP, ela nasceu de uma necessidade de interligar as duas principais metrópoles do Brasil (Rio de Janeiro e São Paulo) com voos regulares, rápidos e sem burocracia. O nome "Ponte Aérea" reflete exatamente o seu propósito: um fluxo contínuo de voos, decolando a cada 30 minutos ou 1 hora, conectando os icônicos aeroportos Santos Dumont (SBRJ) e Congonhas (SBSP).</p>
<p>No início, os lendários Lockheed Constellation, Convair 340 e Scandia faziam o trajeto, mas foi o icônico <strong>Lockheed L-188 Electra II</strong> que dominou a Ponte Aérea por quase 30 anos, tornando-se o símbolo desta rota graças à sua segurança, conforto e confiabilidade, mesmo em dias de tempo ruim nas pistas curtas de ambos os aeroportos.</p>
<p>Hoje, a rota é operada por jatos modernos como os Boeing 737, Airbus A320, Embraer E-Jets e também turboélices avançados como os ATRs. A ponte aérea continua sendo vital para a economia e a cultura brasileira, transportando milhões de passageiros todos os anos num trajeto de apenas 45 a 55 minutos de voo.</p>
<p>Neste World Tour, <strong>você será testado em 7 pernas desafiadoras</strong>, alternando entre as aproximações curtas e deslumbrantes de Congonhas no meio dos prédios e de Santos Dumont com a vista da Baía de Guanabara e do Pão de Açúcar!</p>
"""

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
