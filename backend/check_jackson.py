import requests
import json
import os

api_key = os.environ.get('VITE_API_KEY', '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4')
headers = {'Authorization': f'Bearer {api_key}'}

# 1. Obter o userId do Jackson_Yam
url_users = "https://api.infiniteflight.com/public/v2/users"
payload = {'discourseNames': ['Jackson_Yam']}
res = requests.post(url_users, json=payload, headers=headers)

try:
    data = res.json()
    if data.get('result') and len(data['result']) > 0:
        user_id = data['result'][0]['userId']
        print(f"User ID: {user_id}")
        
        # 2. Obter os voos
        url_flights = f"https://api.infiniteflight.com/public/v2/users/{user_id}/flights"
        f_res = requests.get(url_flights, headers=headers)
        f_data = f_res.json()
        
        # 3. Encontrar ZBAA-RCTP
        if f_data.get('result') and f_data['result'].get('data'):
            for f in f_data['result']['data']:
                if (f.get('originAirport') == 'ZBAA' or f.get('departureAirport') == 'ZBAA') and \
                   (f.get('destinationAirport') == 'RCTP' or f.get('arrivalAirport') == 'RCTP'):
                    print("\n--- VOO ENCONTRADO ---")
                    print(json.dumps(f, indent=2))
                    break
            else:
                print("Voo ZBAA-RCTP não encontrado na API!")
except Exception as e:
    print("Erro:", e)
