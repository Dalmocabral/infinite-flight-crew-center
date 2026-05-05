#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Criar superusuário automaticamente se não existir
echo "from api.models import CustomUser; CustomUser.objects.create_superuser('admin@example.com', 'admin123') if not CustomUser.objects.filter(email='admin@example.com').exists() else None" | python manage.py shell
