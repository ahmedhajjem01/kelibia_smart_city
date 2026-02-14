import random
import requests
from django.conf import settings

def generate_otp():
    """Generates a 4-digit OTP code."""
    return str(random.randint(1000, 9999))

def send_otp_sms(phone_number, otp_code):
    """
    Sends OTP using Infobip Advanced SMS API.
    """
    try:
        api_key = getattr(settings, 'INFOBIP_API_KEY', None)
        base_url = getattr(settings, 'INFOBIP_BASE_URL', None)
        
        if not api_key or not base_url:
            print("ERROR: Infobip credentials are not configured in settings.py", flush=True)
            return False

        # Prepare phone number for Tunisia (Infobip expects 216XXXXXXXX or +216XXXXXXXX)
        to_phone = phone_number.replace(' ', '').replace('-', '')
        if not to_phone.startswith('216') and not to_phone.startswith('+216'):
            to_phone = f"216{to_phone}"

        # Ensure we use https and the complete endpoint
        if not base_url.startswith('http'):
            url = f"https://{base_url}/sms/2/text/advanced"
        else:
            url = f"{base_url}/sms/2/text/advanced"
        
        headers = {
            "Authorization": f"App {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "messages": [
                {
                    "destinations": [{"to": to_phone}],
                    "from": "InfoSMS",  # Standard Infobip test sender, try "ServiceSMS" if this fails
                    "text": f"Tunisia Smart City: Votre code de validation est {otp_code}. Ne le partagez pas."
                }
            ]
        }
        
        print(f"DEBUG INFOBIP: Sending SMS to {to_phone}...", flush=True)
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code in [200, 201]:
            print(f"DEBUG INFOBIP: Success! Response: {response.text}", flush=True)
            return True
        else:
            print(f"DEBUG INFOBIP ERROR: Status {response.status_code} - Response: {response.text}", flush=True)
            return False
            
    except Exception as e:
        print(f"DEBUG INFOBIP CRITICAL ERROR: {e}", flush=True)
        return False
