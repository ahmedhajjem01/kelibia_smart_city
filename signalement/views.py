from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
import json

from .models import Complaint

def index(request):
    return render(request, "signalement/index.html")

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

            # Créer le point géospatial
            location = Point(longitude, latitude, srid=4326)

            # Détecter les doublons (même catégorie dans un rayon de 100m)
            nearby = Complaint.objects.filter(
                category=category,
                location__distance_lte=(location, D(m=100))
            )
            is_duplicate = nearby.exists()

            complaint = Complaint.objects.create(
                title=title,
                description=description,
                category=category,
                location=location,
                photo=photo,
                is_duplicate=is_duplicate,
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

def get_complaints(request):
    complaints = Complaint.objects.all().order_by("-created_at")
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