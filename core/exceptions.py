from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        if isinstance(exc, ValidationError):
            if isinstance(response.data, dict):
                for key in list(response.data.keys()):
                    if 'password' in key.lower() or 'passe' in key.lower():
                        response.data[key] = ["Mot de passe trop faible"]
                    elif isinstance(response.data[key], list):
                        for idx, msg in enumerate(response.data[key]):
                            msg_str = str(msg).lower()
                            if any(term in msg_str for term in ['password', 'passe', 'faible', 'weak', 'too short', 'too common']):
                                response.data[key][idx] = "Mot de passe trop faible"
            elif isinstance(response.data, list):
                for idx, msg in enumerate(response.data):
                    msg_str = str(msg).lower()
                    if any(term in msg_str for term in ['password', 'passe', 'faible', 'weak', 'too short', 'too common']):
                        response.data[idx] = "Mot de passe trop faible"
    return response
