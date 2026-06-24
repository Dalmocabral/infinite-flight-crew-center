import os
import django
import sys

# Forçar o Django a usar as configurações de deploy para ler a DATABASE_URL
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crud.deployment_settings')

# Passos para conectar ao Supabase
print("=== CRIAR SUPERUSER NO SUPABASE ===")
db_url = input("Cole a sua DATABASE_URL do Supabase (aquela que você colocou no Render): ").strip()

if not db_url:
    print("Você precisa colar a URL do banco!")
    sys.exit(1)

# Injeta as variáveis de ambiente necessárias para o Django não reclamar
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER_EXTERNAL_HOSTNAME'] = 'localhost'
os.environ['SECRET_KEY'] = 'fake_secret_key_just_for_this_script'

# Inicializa o Django com o banco remoto
try:
    django.setup()
except Exception as e:
    print(f"Erro ao inicializar o Django: {e}")
    sys.exit(1)

from api.models import CustomUser

email = 'dalmo.santos.cabral@gmail.com'
password = 'aretha160491'

try:
    # Verifica se já existe
    if CustomUser.objects.filter(email=email).exists():
        print(f"O usuário {email} já existe no banco de dados!")
        user = CustomUser.objects.get(email=email)
        user.is_superuser = True
        user.is_staff = True
        user.set_password(password)
        user.save()
        print("A senha foi atualizada e as permissões de Admin foram concedidas novamente!")
    else:
        user = CustomUser.objects.create_superuser(email=email, password=password)
        print(f"✅ Superuser '{email}' criado com SUCESSO direto no Supabase!")
except Exception as e:
    print(f"❌ Erro ao criar superuser: {e}")
