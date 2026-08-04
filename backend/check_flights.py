from api.models import CustomUser, PirepsFlight, LandingReport

users = CustomUser.objects.filter(usernameIFC__icontains='andre_siqueira2')
print('Users found by IFC username:', users.count())
if not users.exists():
    users = CustomUser.objects.filter(username__icontains='andre_siqueira2')
    print('Users found by Django username:', users.count())

flights = PirepsFlight.objects.filter(pilot__in=users, departure_airport='SBRJ', arrival_airport='SBSP')
print('Flights SBRJ->SBSP:', flights.count())

for f in flights:
    has_lr = hasattr(f, 'landing_report') and f.landing_report is not None
    lr = f.landing_report if has_lr else None
    
    print(f"\nFlight ID: {f.id}")
    print(f"Date: {f.registration_date}")
    print(f"Has Landing Report: {has_lr}")
    
    if has_lr:
        print(f"G Force: {lr.g_force}")
        print(f"Centerline: {lr.centerline_deviation}")
        print(f"FPM: {lr.vs_touchdown}")
