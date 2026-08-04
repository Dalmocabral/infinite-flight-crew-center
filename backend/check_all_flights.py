from api.models import PirepsFlight
flights = PirepsFlight.objects.filter(departure_airport='SBRJ', arrival_airport='SBSP')
print("Total SBRJ->SBSP flights:", flights.count())
for f in flights:
    print(f"Flight ID: {f.id}, Pilot: {f.pilot}, IFC: {f.pilot.usernameIFC if f.pilot else 'None'}")
