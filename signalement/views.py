from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from .models import Complaint
from .classifier import classify

User = get_user_model()

def get_user_from_token(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ')[1]
        try:
            token = AccessToken(token_str)
            user_id = token['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None
    return None

def index(request):
    return render(request, "signalement/index.html")

def dashboard(request):
    return render(request, "signalement/dashboard.html")

@csrf_exempt
def add_complaint(request):
    if request.method == "POST":
        try:
            title = request.POST.get("title")
            description = request.POST.get("description")
            category = request.POST.get("category")
            latitude = float(request.POST.get("latitude"))
            longitude = float(request.POST.get("longitude"))
            photo = request.FILES.get("photo")

            location = Point(longitude, latitude, srid=4326)

            classification = classify(description, location=location, category=category)
            priority = classification["priority"]
            is_duplicate = classification["is_duplicate"]

            # Récupérer le citoyen connecté si token présent
            citizen = get_user_from_token(request)

            complaint = Complaint.objects.create(
                title=title,
                description=description,
                category=category,
                location=location,
                photo=photo,
                priority=priority,
                is_duplicate=is_duplicate,
                citizen=citizen,
            )

            return JsonResponse({
                "id": complaint.id,
                "title": complaint.title,
                "description": complaint.description,
                "category": complaint.get_category_display(),
                "status": complaint.get_status_display(),
                "priority": complaint.get_priority_display(),
                "latitude": latitude,
                "longitude": longitude,
                "is_duplicate": is_duplicate,
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

def get_complaints(request):
    token_user = get_user_from_token(request)
    
    if token_user and token_user.user_type == 'agent':
        # Agent voit tout
        complaints = Complaint.objects.all().order_by("-created_at")
    elif token_user:
        # Citoyen voit uniquement ses réclamations
        complaints = Complaint.objects.filter(citizen=token_user).order_by("-created_at")
    else:
        # Non connecté — liste vide
        complaints = Complaint.objects.none()

    data = []
    for c in complaints:
        data.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.get_category_display(),
            "status": c.get_status_display(),
            "priority": c.get_priority_display(),
            "latitude": c.location.y,
            "longitude": c.location.x,
            "is_duplicate": c.is_duplicate,
        })
    return JsonResponse(data, safe=False)