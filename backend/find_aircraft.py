import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')
os.environ['DATABASE_URL'] = "postgresql://postgres.tyufrbywqtgqgcelaszd:L%40naLu%40n160491@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
django.setup()

from api.models import Aircraft

print("Searching for aircraft in DB...")
keywords = ['777', '747', 'MD-11', 'A330']
for kw in keywords:
    print(f"--- {kw} ---")
    for a in Aircraft.objects.filter(name__icontains=kw):
        print(f"ID: {a.if_id} | Name: {a.name} | Category: {a.category}")
