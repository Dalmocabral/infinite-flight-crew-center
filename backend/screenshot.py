import os
import time
from playwright.sync_api import sync_playwright

def take_screenshots():
    out_dir = r"d:\infinite-flight-crew-center\frontend\public\wiki_images"
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Acessando login...")
        page.goto("https://infinite-flight-crew-center.onrender.com/login")
        page.screenshot(path=os.path.join(out_dir, "debug_login.png"), full_page=True)
        
        try:
            page.wait_for_load_state("networkidle")
            page.fill("input[name='email']", "luan@gmail.com")
            page.fill("input[name='password']", "aretha160491")
            page.keyboard.press("Enter")
            
            print("Aguardando carregamento do Dashboard...")
            page.wait_for_url("**/app/dashboard", timeout=90000)
        except Exception as e:
            page.screenshot(path=os.path.join(out_dir, "debug_error.png"), full_page=True)
            raise e
        time.sleep(5)
        
        print("Print: Dashboard")
        page.screenshot(path=os.path.join(out_dir, "dashboard.png"), full_page=False)
        
        print("Navegando para World Tours...")
        page.goto("https://infinite-flight-crew-center.onrender.com/app/awards")
        time.sleep(5)
        print("Print: World Tours")
        page.screenshot(path=os.path.join(out_dir, "world_tours.png"), full_page=False)

        print("Abrindo detalhes do Tour...")
        try:
            # clicar no card ou botão do F1 Tour ou South America
            page.locator("text=South America").first.click(timeout=5000)
            time.sleep(3)
            print("Print: Tour Details")
            page.screenshot(path=os.path.join(out_dir, "tour_details.png"), full_page=False)
            
            # scroll down
            page.mouse.wheel(0, 500)
            time.sleep(2)
            page.screenshot(path=os.path.join(out_dir, "tour_map.png"), full_page=False)
            
            # Fechar modal
            page.keyboard.press("Escape")
            time.sleep(1)
        except Exception as e:
            print(f"Não conseguiu abrir detalhes do tour: {e}")

        print("Navegando para My Flights...")
        page.goto("https://infinite-flight-crew-center.onrender.com/app/my-flights")
        time.sleep(5)
        print("Print: My Flights")
        page.screenshot(path=os.path.join(out_dir, "my_flights.png"), full_page=False)
        
        print("Abrindo Briefing de Voo...")
        try:
            page.locator("text=Briefing").first.click(timeout=5000)
            time.sleep(3)
            print("Print: Flight Briefing")
            page.screenshot(path=os.path.join(out_dir, "flight_briefing.png"), full_page=False)
            page.keyboard.press("Escape")
            time.sleep(1)
        except Exception as e:
            try:
                page.locator("tbody tr").first.click(timeout=5000)
                time.sleep(3)
                page.screenshot(path=os.path.join(out_dir, "flight_briefing.png"), full_page=False)
            except:
                print(f"Não conseguiu abrir briefing: {e}")

        print("Navegando para o Tracker Map...")
        page.goto("https://infinite-flight-crew-center.onrender.com/app/map")
        time.sleep(8)
        print("Print: Map")
        page.screenshot(path=os.path.join(out_dir, "live_map.png"), full_page=False)

        print("Navegando para Members...")
        page.goto("https://infinite-flight-crew-center.onrender.com/app/members")
        time.sleep(5)
        print("Print: Members")
        page.screenshot(path=os.path.join(out_dir, "members.png"), full_page=False)
        
        browser.close()
        print("Todos os screenshots foram salvos com sucesso!")

if __name__ == "__main__":
    take_screenshots()
