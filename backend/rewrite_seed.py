import json
with open('dump_ach2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item['name'] == 'Corporate Drone':
        item['description'] = 'Join an official VA/VO on the Infinite Flight Community.'

with open('seed_achievements.py', 'w', encoding='utf-8') as out:
    out.write('''import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.settings')
django.setup()

from api.models import Achievement

print("Clearing old achievements to prevent duplicates...")
Achievement.objects.all().delete()

achievements_data = ''')
    out.write(json.dumps(data, indent=4))
    out.write('''

for ach_data in achievements_data:
    Achievement.objects.create(**ach_data)

print(f"Finished! {len(achievements_data)} achievements added to the database.")

from django.contrib.auth import get_user_model
from api.models import UserAchievement
from api.views import check_achievements
User = get_user_model()

print("Scanning all users to retroactively grant new achievements...")
for user in User.objects.all():
    check_achievements(user)

updated = UserAchievement.objects.all().update(viewed=False)
print(f"Done. {updated} achievements marked as unread to show animations.")
''')
print('seed_achievements.py created with original 30 achievements')
