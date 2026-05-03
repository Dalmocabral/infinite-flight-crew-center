import os
import requests
from django.core.management.base import BaseCommand
from api.models import Aircraft

class Command(BaseCommand):
    help = 'Syncs aircraft from Infinite Flight API'

    def handle(self, *args, **kwargs):
        # We can try to use a default dev key or fetch from Django settings, but hardcoding for demo is fine.
        api_key = os.environ.get("IF_API_KEY", "36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4")
        url = f"https://api.infiniteflight.com/public/v2/aircraft?apikey={api_key}"
        
        self.stdout.write("Fetching aircraft from Infinite Flight API...")
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data.get("errorCode") == 0:
                aircraft_list = data.get("result", [])
                created_count = 0
                updated_count = 0
                
                for ac in aircraft_list:
                    obj, created = Aircraft.objects.update_or_create(
                        if_id=ac["id"],
                        defaults={"name": ac["name"]}
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                        
                self.stdout.write(self.style.SUCCESS(f"Successfully synced aircraft. Created: {created_count}, Updated: {updated_count}"))
            else:
                self.stdout.write(self.style.ERROR(f"API returned error code: {data.get('errorCode')}"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error syncing aircraft: {str(e)}"))
