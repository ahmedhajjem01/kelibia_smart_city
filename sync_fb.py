import os
import django
import requests
from django.core.files.base import ContentFile
from django.utils.text import slugify
from datetime import datetime

# Initialize Django environment
from dotenv import load_dotenv
load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from news.models import Article
from django.contrib.auth import get_user_model

User = get_user_model()

# ==========================================
# CONFIGURATION
# ==========================================
# Set MOCK_MODE to False to use the real Facebook API
MOCK_MODE = True

# Replace these with your real Facebook App information later
PAGE_ID = "commune.kelibia" # Identifiant de la page de la municipalité
PAGE_ACCESS_TOKEN = "VOTRE_JETON_D_ACCES_ICI"

def get_facebook_posts():
    if MOCK_MODE:
        print("Mock mode enabled. Using sample Facebook data...")
        return [
            {
                "id": "commune_kel_1001",
                "message": "📢 BLAĞ MUNIĆIPAL : Entretien de l'Éclairage Public 💡\n\nLa municipalité de Kélibia informe tous les citoyens que l'équipe technique municipale a entamé hier soir une campagne d'entretien et de réparation du réseau d'éclairage public au niveau de l'avenue de l'Environnement et la route du Port.\n\nNous invitons les citoyens à signaler toute panne d'éclairage dans leurs quartiers via le portail citoyen.\n\n#Kelibia #TravauxMunicipaux",
                "created_time": "2026-04-05T09:00:00+0000",
                "full_picture": "https://picsum.photos/seed/kelibia_light/800/600", 
                "permalink_url": "https://www.facebook.com/commune.kelibia/posts/1001"
            },
            {
                "id": "commune_kel_1002",
                "message": "🌳🌿 Campagne Exceptionnelle de Propreté à Kélibia 🌊\n\nEn prévision de la saison estivale, la Municipalité de Kélibia, en collaboration avec l'Association des Amis de l'Environnement, organise une grande campagne de nettoyage de la plage de Mansoura et du circuit touristique menant au Fort.\n\n📍 Rendez-vous : Ce dimanche à 08h00 devant le parking de Mansoura.\nDes sacs et des gants seront fournis sur place. Soyez nombreux pour garder notre ville, la perle du Cap Bon, propre !\n\n#KelibiaVivre #Environnement #Mansoura",
                "created_time": "2026-04-03T14:30:00+0000",
                "full_picture": "https://picsum.photos/seed/kelibia_beach/800/600", 
                "permalink_url": "https://www.facebook.com/commune.kelibia/posts/1002"
            },
            {
                "id": "commune_kel_1003",
                "message": "⚠️ Avis aux citoyens : Campagne de fumigation (Lutte contre les moustiques) 🦟\n\nDans le cadre du programme de prévention sanitaire, la municipalité de Kélibia annonce qu'une opération de pulvérisation d'insecticides aura lieu durant la nuit (de 22h à 04h du matin) dans les zones suivantes :\n- Oued El Khatfa\n- Cité El Wafa\n- Zone du Vieux Port\n\nNous prions les habitants de ces zones de maintenir leurs fenêtres fermées durant cette période.\nMerci de votre compréhension.",
                "created_time": "2026-04-01T17:00:00+0000",
                "full_picture": "https://picsum.photos/seed/kelibia_night/800/600", 
                "permalink_url": "https://www.facebook.com/commune.kelibia/posts/1003"
            },
            {
                "id": "commune_kel_1004",
                "message": "🏆 Cérémonie de gratification des élèves excellents 🎓\n\nSous l'égide du Maire de Kélibia, une cérémonie s'est tenue aujourd'hui au Palais Municipal pour honorer les bacheliers lauréats des différents lycées de Kélibia (Lycée Abdelaziz Khouja, Lycée Route de la Plage, etc.).\n\nUn grand bravo à nos brillants élèves qui honorent notre ville. La municipalité s'engage toujours à soutenir le savoir et l'éducation ! 👏🇹🇳",
                "created_time": "2026-03-25T11:15:00+0000",
                "full_picture": "https://picsum.photos/seed/kelibia_school/800/600", 
                "permalink_url": "https://www.facebook.com/commune.kelibia/posts/1004"
            },
            {
                "id": "commune_kel_1005",
                "message": "🚧 Projet en cours : Réaménagement du centre-ville 🚜\n\nLe Conseil Municipal a le plaisir d'informer les citoyens que les travaux de bitumage de la Rue de la République (près de la Poste) avancent à un rythme soutenu. Ces travaux s'inscrivent dans le Plan d'Investissement Communal (PIC) pour l'année en cours.\n\nNous nous excusons pour le dérangement occasionné par le chantier et vous remercions de votre patience.",
                "created_time": "2026-03-20T10:00:00+0000",
                "full_picture": "https://picsum.photos/seed/kelibia_street/800/600",
                "permalink_url": "https://www.facebook.com/commune.kelibia/posts/1005"
            }
        ]
    else:
        print("Fetching data from Facebook Graph API...")
        url = f"https://graph.facebook.com/v19.0/{PAGE_ID}/posts"
        params = {
            "fields": "message,full_picture,created_time,permalink_url",
            "access_token": PAGE_ACCESS_TOKEN,
            "limit": 10
        }
        res = requests.get(url, params=params)
        if res.status_code == 200:
            return res.json().get('data', [])
        else:
            print(f"Error fetching from Facebook: {res.text}")
            return []

def sync_posts():
    # 1. Ensure we have an author for these Facebook posts
    admin_user, created = User.objects.get_or_create(
        username="Commune_Kélibia",
        defaults={
            "email": "contact@kelibia.tn",
            "is_staff": True,
            "first_name": "Commune",
            "last_name": "de Kélibia",
            "phone": "98123456"
        }
    )
    if created:
        admin_user.set_password("password123")
        admin_user.save()

    # 2. Get posts
    posts = get_facebook_posts()
    
    count_added = 0
    
    for post in posts:
        post_id = post.get('id')
        message = post.get('message', '')
        # Only import posts that actually have a message
        if not message:
            continue
            
        slug = f"facebook-{post_id}"
        
        # Check if we already imported this post
        if Article.objects.filter(slug=slug).exists():
            print(f"Post {post_id} already exists. Skipping.")
            continue
        
        print(f"Importing new Facebook post: {post_id}...")
        
        # Generate a title from the first 50 chars of the message
        title_summary = message[:50].replace('\n', ' ')
        title = f"{title_summary}..." if len(message) > 50 else title_summary
        
        created_time = datetime.strptime(post.get('created_time'), "%Y-%m-%dT%H:%M:%S+0000")
        
        article = Article(
            author=admin_user,
            title=title,
            slug=slug,
            content=message + f"\n\n🔗 Lien vers la publication originale: {post.get('permalink_url', '')}",
            is_published=True,
        )
        # We manually keep the original facebook date
        article.created_at = created_time
        
        # Download and save the image if present
        picture_url = post.get('full_picture')
        if picture_url:
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                img_res = requests.get(picture_url, headers=headers, timeout=10)
                if img_res.status_code == 200:
                    image_name = f"fb_{post_id}.jpg"
                    article.image.save(image_name, ContentFile(img_res.content), save=False)
            except Exception as e:
                print(f"Failed to download image for {post_id}: {e}")
        
        article.save()
        count_added += 1

    print(f"Sync complete! Added {count_added} new articles from Facebook.")

if __name__ == "__main__":
    sync_posts()
