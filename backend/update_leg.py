import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Award, FlightLeg

def update_legs():
    tour = Award.objects.filter(name="Tour do Brasil (Teste GA)").first()
    if tour:
        # Deletar pernas antigas
        tour.flight_legs.all().delete()
        
        # Criar novas pernas com SBRJ -> SBJR como a primeira
        legs = [
            ("SBRJ", "SBJR"),
            ("SBJR", "SBGR"),
            ("SBGR", "SBCF"),
            ("SBCF", "SBSV"),
            ("SBSV", "SBRF"),
        ]
        
        for i, (orig, dest) in enumerate(legs, start=1):
            FlightLeg.objects.create(
                award=tour,
                from_airport=orig,
                to_airport=dest
            )
        print("Pernas do Tour atualizadas com SBRJ -> SBJR sendo a primeira!")
    else:
        print("Tour não encontrado.")

if __name__ == '__main__':
    update_legs()
