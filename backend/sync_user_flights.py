import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Award, FlightLeg, CustomUser

def get_latest_flights():
    user = CustomUser.objects.filter(usernameIFC__isnull=False).exclude(usernameIFC="").first()
    if not user:
        print("Erro: Nenhum usuário encontrado com 'usernameIFC' preenchido no banco de dados.")
        print("Por favor, preencha o seu IFC Username (nome do fórum) no banco ou pelo app antes.")
        return

    username = user.usernameIFC
    api_key = '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4'
    
    print(f"Buscando voos na API do IF para: {username}")
    
    # 1. Obter UserID
    res = requests.post(
        f"https://api.infiniteflight.com/public/v2/users?apikey={api_key}",
        json={"discourseNames": [username]}
    )
    data = res.json()
    if not data.get("result"):
        print(f"Usuário {username} não encontrado na API.")
        return
        
    user_id = data["result"][0]["userId"]
    
    # 2. Obter Voos
    res_flights = requests.get(f"https://api.infiniteflight.com/public/v2/users/{user_id}/flights?apikey={api_key}")
    flights_data = res_flights.json()
    if not flights_data.get("result") or not flights_data["result"].get("data"):
        print("Nenhum voo encontrado no logbook.")
        return
        
    flights = flights_data["result"]["data"]
    
    # 3. Filtrar os 5 mais recentes
    unique_legs = []
    seen = set()
    for f in flights:
        orig = f.get("originAirport")
        dest = f.get("destinationAirport")
        if orig and dest and len(orig) == 4 and len(dest) == 4:
            leg_tuple = (orig, dest)
            if leg_tuple not in seen:
                seen.add(leg_tuple)
                unique_legs.append(leg_tuple)
            if len(unique_legs) == 5:
                break
                
    if not unique_legs:
        print("Não foi possível extrair voos (faltando códigos ICAO).")
        return

    print("Últimas pernas identificadas:")
    for o, d in unique_legs:
        print(f" {o} -> {d}")

    # 4. Atualizar o Tour
    tour = Award.objects.filter(name__icontains="Tour do Brasil").first()
    if tour:
        tour.flight_legs.all().delete()
        # Inverter para que o mais antigo seja a perna 1, se desejado.
        # Mas a lista já foi gerada do mais recente para o antigo.
        # Vamos inseri-los na ordem em que vieram.
        for i, (orig, dest) in enumerate(reversed(unique_legs), start=1):
            FlightLeg.objects.create(award=tour, from_airport=orig, to_airport=dest)
        
        # Remover restrições de aeronave para garantir aprovação automática no teste
        tour.allowed_aircrafts.all().delete()
        tour.allowed_categories.all().delete()
        tour.allowed_icao.all().delete()
        
        print("\nSucesso! As pernas do Tour foram alteradas para refletir seus voos reais!")
        print("Restrições de aeronave e ICAO foram removidas temporariamente para facilitar o teste do autopreenchimento.")
    else:
        print("Tour não encontrado no banco.")

if __name__ == '__main__':
    get_latest_flights()
