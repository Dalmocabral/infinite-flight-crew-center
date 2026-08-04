#!/usr/bin/env bash
set -o errexit

cd backend

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Seed new achievements automatically on deploy
python seed_achievements.py

if [[ $CREATE_SUPERUSER ]]; then
    python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(
        email='admin@example.com',
        password='123456'
    )
END
fi
