import requests
import json
from datetime import datetime

API_KEY = "36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4"
HEADERS = {'Authorization': f'Bearer {API_KEY}'}
BASE_URL = "https://api.infiniteflight.com/public/v2"

username = "Andre_Siqueira2"

# 1. Get user ID
print(f"Fetching ID for user: {username}...")
resp = requests.post(f"{BASE_URL}/users", headers=HEADERS, json={"discourseNames": [username]})
if resp.status_code == 200:
    data = resp.json().get('result', [])
    if data:
        user_id = data[0].get('userId')
        print(f"User ID found: {user_id}")
        
        # 2. Get user flights
        print(f"Fetching flights for user ID: {user_id}...")
        flights_resp = requests.get(f"{BASE_URL}/users/{user_id}/flights", headers=HEADERS)
        if flights_resp.status_code == 200:
            result = flights_resp.json().get('result')
            print("Type of result:", type(result))
            print("Content:", result)
        else:
            print(f"Failed to fetch flights: {flights_resp.status_code} {flights_resp.text}")
    else:
        print("User not found in Infinite Flight API.")
else:
    print(f"Failed to fetch user ID: {resp.status_code} {resp.text}")
