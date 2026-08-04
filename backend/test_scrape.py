import requests

def download_html():
    url = "https://portalpasha.ru/charts/"
    try:
        response = requests.get(url, timeout=10)
        with open("charts.html", "w", encoding="utf-8") as f:
            f.write(response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    download_html()
