import requests
from datetime import datetime, timedelta, timezone
import logging
import json
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
TRESTLE_CLIENT_ID = "d63ef0f1cad54d3f9046bd8b33cc70e2"
TRESTLE_CLIENT_SECRET = "851035be936449588b55667346f2d2d4"
TOKEN_URL = "https://api-trestle.corelogic.com/trestle/oidc/connect/token"
API_BASE_URL = "https://api-trestle.corelogic.com/trestle/odata"
_current_access_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE3NDY3MjM4OTMsImV4cCI6MTc0Njc1MjY5MywiaXNzIjoiaHR0cHM6Ly90cmVzdGxlLWF1dGgtcHJkLmtmdXN3MXByZC5zb2x1dGlvbnMuY29yZWxvZ2ljLmNvbSIsImF1ZCI6Imh0dHBzOi8vdHJlc3RsZS1hdXRoLXByZC5rZnVzdzFwcmQuc29sdXRpb25zLmNvcmVsb2dpYy5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiZDYzZWYwZjFjYWQ1NGQzZjkwNDZiZDhiMzNjYzcwZTIiLCJjbGllbnRfcm9sZSI6IkFQSSIsImlhdCI6MTc0NjcyMzg5Mywic2NvcGUiOiJhcGkifQ.w56FXOG_SXKdJpZ7Sx4Aqas82YBtidMiXTJzSaJtdnWWKUFO5mUJc-xDRFHv_wG91D_zrf8MjtCdRlpTUITNHtkCNbjhNYtoUPNns6twwZ4h-oLHF2_Isauahy2FHkQAuLS_7WIN8Pe08tCebKTiftcc3-8hGghw1lLieuvEiaVyTsYickZmEPOgP6GZu49I8xs6uekmMiMgieyaPBmM6U3jLz2vLP0UU7vtbESeqYUGfaC46HKBToJq2wR6nT1-c8qXmd5jf6unODTIPRdPDTOFGLcnXclidaVfpd9NRTaCTsLwbJQvlmrwNH3jhrEtM_VSYxBYdLRvNBY8lIw20A"
_token_expires_at = None
def get_trestle_token():
    """Holt einen neuen Access Token und aktualisiert globale Variablen."""
    global _current_access_token, _token_expires_at
    payload = {
        'client_id': TRESTLE_CLIENT_ID,
        'client_secret': TRESTLE_CLIENT_SECRET,
        'grant_type': 'client_credentials',
        'scope': 'api'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = None
    try:
        response = requests.post(TOKEN_URL, headers=headers, data=payload)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get('access_token')
        expires_in_seconds = token_data.get('expires_in')
        if access_token and expires_in_seconds:
            now = datetime.now(timezone.utc)
            _current_access_token = access_token
            _token_expires_at = now + timedelta(seconds=expires_in_seconds)
            logging.info(f"Token erfolgreich erhalten/erneuert. Gültig bis: {_token_expires_at.strftime('%Y-%m-%dT%H:%M:%SZ')}")
            return True
        else:
            logging.error("FEHLER: Token oder expires_in nicht in API-Antwort gefunden.")
            _current_access_token = None
            _token_expires_at = None
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Fehler beim Holen des Tokens: {e}")
        if response is not None:
            logging.error(f"Antwort-Status: {response.status_code}")
            logging.error(f"Antwort-Body: {response.text}")
        _current_access_token = None
        _token_expires_at = None
        return False

# get_trestle_token()
# print(_current_access_token)
def ensure_valid_token():
    print("ensure_valid_token") 
    return True
def test():

    print("get_all_active_listings")
    global _current_access_token
    exclude_county_filter = "(CountyOrParish ne 'Los Angeles' and CountyOrParish ne 'Orange' and CountyOrParish ne 'San Diego')"
    params = {
        '$filter': f"StandardStatus eq 'Active' and {exclude_county_filter}",
        '$expand': 'Media',
        '$top': 1000 # Hohe Seitengröße
    }
    print(params)
    next_url = f"{API_BASE_URL}/Property"
    page_count = 0
    max_pages = 10000 # Hohes Limit
    total_yielded = 0
    print(next_url)
    while next_url and page_count < max_pages:
        if not ensure_valid_token():
            logging.error("FEHLER: Token konnte nicht erneuert werden. Breche Abruf ab.")
            return
        headers = {
            'Authorization': f'Bearer {_current_access_token}'
        }
        page_count += 1
        logging.info(f"\nRufe Seite {page_count} ab von: {next_url}" + (f" mit Parametern: {params}" if params else ""))
        response = None
        try:
            current_request_url = next_url
            current_params = params if params else {}
            params = None

          
            response = requests.get(current_request_url, headers=headers, params=current_params, timeout=60) # Timeout hinzufügen

            # --- Ende Retry-Logik ---
            print(response.json())
            data = response.json()
            listings_on_page = data.get('value', [])
            if listings_on_page:
                logging.info(f"  {len(listings_on_page)} Listings auf dieser Seite gefunden.")
                total_yielded += len(listings_on_page)
                yield listings_on_page
            else:
                logging.info("  Leere Seite empfangen.")
            next_url = data.get('@odata.nextLink')
            if not next_url:
                logging.info("Kein @odata.nextLink gefunden, Abruf beendet.")
                break
        except requests.exceptions.RequestException as e:
            logging.error(f"Fehler beim Abrufen der Listing-Seite (nach Retries): {e}", exc_info=True)
            if response is not None:
                logging.error(f"  Letzter Antwort-Status: {response.status_code}")
            return
        except json.JSONDecodeError as e:
            logging.error(f"Fehler beim Dekodieren der JSON-Antwort: {e}", exc_info=True)
            if response is not None:
                 logging.error(f"  Letzter Antwort-Body: {response.text}")
            return
        except Exception as e: # Fange auch andere potenzielle Fehler (z.B. von tenacity)
             logging.error(f"Unerwarteter Fehler im Abruf-Generator: {e}", exc_info=True)
             return
    if page_count >= max_pages:
         logging.warning(f"Maximales Seitenlimit ({max_pages}) erreicht.")
    logging.info(f"\nGenerator beendet. Insgesamt {total_yielded} Listings über {page_count} Seiten geliefert.")
    return total_yielded
if __name__ == "__main__":
    get_all_active_listings()
