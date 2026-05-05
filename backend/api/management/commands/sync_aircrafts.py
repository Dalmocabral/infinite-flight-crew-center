import os
import requests
from django.core.management.base import BaseCommand
from api.models import Aircraft

# Mapeamento de palavras-chave para categoria
# ATENCAO: A ORDEM IMPORTA - regras mais especificas devem vir primeiro!
CATEGORY_MAP = [
    # Military
    ('F-14', 'Military'), ('F-16', 'Military'), ('F/A-18', 'Military'),
    ('F-22', 'Military'), ('A-10', 'Military'),
    ('C-130', 'Military'), ('C-17', 'Military'),
    ('P-38', 'Military'), ('SR-71', 'Military'),
    ('Spitfire', 'Military'), ('Hurricane', 'Military'),
    ('B-2', 'Military'), ('B-52', 'Military'), ('AV-8', 'Military'),

    # Cargo - nomes reais da API do IF (terminam em F)
    ('777F', 'Cargo'),
    ('DC-10F', 'Cargo'),
    ('MD-11F', 'Cargo'),
    ('A330-200F', 'Cargo'),
    ('747-8F', 'Cargo'),
    ('Freighter', 'Cargo'),

    # Business Jet
    ('Challenger 350', 'Bizjet'), ('Global Express', 'Bizjet'),
    ('Citation', 'Bizjet'), ('Learjet', 'Bizjet'), ('Gulfstream', 'Bizjet'),
    ('Phenom', 'Bizjet'), ('Praetor', 'Bizjet'), ('Vision Jet', 'Bizjet'),

    # General Aviation (GA)
    ('Cessna 172', 'GA'), ('Cessna 208', 'GA'),
    ('CubCrafters', 'GA'), ('XCub', 'GA'),
    ('Cirrus SR22', 'GA'), ('TBM-930', 'GA'),
    ('Piper PA28', 'GA'),
    ('Dash 8-Q400', 'GA'),

    # Extra Small (XS)
    ('CRJ-200', 'XS'), ('E170', 'XS'), ('ERJ', 'XS'),

    # Small (S)
    ('CRJ-700', 'S'), ('CRJ-900', 'S'), ('CRJ-1000', 'S'),
    ('717-200', 'S'), ('737-700', 'S'), ('737-8 MAX', 'S'),
    ('A220-300', 'S'), ('E175', 'S'), ('E190', 'S'), ('E195', 'S'),

    # Medium (M)
    ('737-800', 'M'), ('737-900', 'M'), ('737-9 MAX', 'M'),
    ('757-200', 'M'),
    ('A318', 'M'), ('A319', 'M'), ('A320', 'M'), ('A321', 'M'),

    # Large (L) - ANTES do 747/A380 para evitar conflito
    ('767-300', 'L'), ('787-8', 'L'), ('787-9', 'L'), ('787-10', 'L'),
    ('A330-200', 'L'), ('A330-300', 'L'), ('A330-900', 'L'),
    ('A340-600', 'L'), ('A350', 'L'),
    ('777-200ER', 'L'), ('777-200LR', 'L'), ('777-300ER', 'L'),
    ('DC-10', 'L'), ('MD-11', 'L'),

    # Extra Large (XL)
    ('747-200', 'XL'), ('747-400', 'XL'), ('747-8', 'XL'),
    ('A380', 'XL'), ('An-225', 'XL'),
]


def get_category(name: str) -> str:
    """Match aircraft name to category using keyword rules."""
    for keyword, category in CATEGORY_MAP:
        if keyword.lower() in name.lower():
            return category
    return 'Uncategorized'


class Command(BaseCommand):
    help = 'Syncs aircraft from Infinite Flight API and assigns categories'

    def handle(self, *args, **kwargs):
        api_key = os.environ.get("IF_API_KEY", "36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4")
        url = f"https://api.infiniteflight.com/public/v2/aircraft?apikey={api_key}"

        self.stdout.write("Fetching aircraft from Infinite Flight API...")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

            if data.get("errorCode") == 0:
                aircraft_list = data.get("result", [])
                created_count = 0
                updated_count = 0

                for ac in aircraft_list:
                    category = get_category(ac["name"])
                    obj, created = Aircraft.objects.update_or_create(
                        if_id=ac["id"],
                        defaults={
                            "name": ac["name"],
                            "category": category,
                        }
                    )
                    if created:
                        created_count += 1
                        self.stdout.write(f"  + {ac['name']} [{category}]")
                    else:
                        updated_count += 1
                        self.stdout.write(f"  ~ {ac['name']} [{category}]")

                self.stdout.write(self.style.SUCCESS(
                    f"Done! Created: {created_count}, Updated: {updated_count}"
                ))
            else:
                self.stdout.write(self.style.ERROR(f"API error: {data.get('errorCode')}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
