from api.models import CustomUser

users = CustomUser.objects.all()
for u in users:
    print(f"Username: '{u.username}', IFC: '{u.usernameIFC}', ID: {u.id}")
