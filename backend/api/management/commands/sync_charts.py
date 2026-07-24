import requests
import re
from django.core.management.base import BaseCommand
from api.models import Chart

class Command(BaseCommand):
    help = 'Fetches and syncs charts from portalpasha'

    def handle(self, *args, **kwargs):
        url = "https://portalpasha.ru/charts/"
        try:
            self.stdout.write(f"Fetching {url} ...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            content = response.text

            # Parse with regex
            pattern = re.compile(
                r"<a href='([^']+)'[^>]*id='icao-code-class'[^>]*>([^<]+)</a>.*?"
                r"<span id='country__name'>([^<]*)</span>.*?"
                r"<span id='city__name'>([^<]*)</span>.*?"
                r"<span id='airport__name'>([^<]*)</span>.*?"
                r"<span id='iata'>([^<]*)</span>.*?"
                r"<span id='region'>([^<]*)</span>.*?"
                r"<span id='rwys'>([^<]*)</span>",
                re.DOTALL | re.IGNORECASE
            )
            
            matches = pattern.findall(content)
            self.stdout.write(f"Found {len(matches)} charts.")

            count = 0
            for match in matches:
                pdf_url, icao, country, city, name, iata, region, runways = match
                
                # The pdf url is relative, make it absolute
                if pdf_url.startswith('/'):
                    pdf_url = "https://portalpasha.ru" + pdf_url

                Chart.objects.update_or_create(
                    icao=icao.strip(),
                    defaults={
                        'iata': iata.strip() if iata else None,
                        'country': country.strip(),
                        'city': city.strip(),
                        'name': name.strip(),
                        'region': region.strip(),
                        'runways': runways.strip(),
                        'pdf_url': pdf_url.strip(),
                    }
                )
                count += 1

            self.stdout.write(self.style.SUCCESS(f"Successfully synced {count} charts."))

        except Exception as e:
            self.stderr.write(f"Error: {e}")


