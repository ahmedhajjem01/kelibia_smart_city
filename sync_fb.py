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
PAGE_ID = "MunKelibia" # Identifiant de la page de la municipalité
PAGE_ACCESS_TOKEN = "VOTRE_JETON_D_ACCES_ICI"

def get_facebook_posts():
    if MOCK_MODE:
        print("Mock mode enabled. Using sample Facebook data from @MunKelibia...")
        return [
            {
                "id": "munkel_1001",
                "message": "🧹 تواصل تدخلات النظافة والعناية بالمحيط 🌿\n\nتواصل الفرق الفنية لبلدية قليبية تدخلاتها الميدانية للنظافة والعناية بالمحيط، حيث شملت التدخلات اليوم الأنهج التالية:\n- نهج الشهداء\n- محيط البرج وقصر البلدية\n- وسط المدينة ونهج طارق ابن زياد\n\nنعمل من أجل مدينة أجمل وأنظف للجميع.\n\n#بلدية_قليبية #نظافة #تونس",
                "created_time": "2026-04-05T10:00:00+0000",
                "full_picture": "https://images.unsplash.com/photo-1594911771142-99052026f74a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", 
                "permalink_url": "https://www.facebook.com/MunKelibia/posts/1001"
            },
            {
                "id": "munkel_1002",
                "message": "🌳 حملة نظافة استثنائية بشارع البيئة وحي المنتزه 🌊\n\nقامت مصالح النظافة ببلدية قليبية بتدخلات واسعة شملت شارع البيئة وشارع الجمهورية وحي المنتزه ومحيط المدرسة البحرية.\n\nتأتي هذه التدخلات في إطار برنامج العناية بالفضاءات العامة والمساحات الخضراء.\n\n#قليبية_خضراء #بلدية_قليبية",
                "created_time": "2026-04-04T15:30:00+0000",
                "full_picture": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", 
                "permalink_url": "https://www.facebook.com/MunKelibia/posts/1002"
            },
            {
                "id": "munkel_1003",
                "message": "📢 بلاغ توضيحي إلى الرأي العام ⚠️\n\nتعلم بلدية قليبية كافة المتساكنين والعموم بخصوص سير العمل بمختلف المصالح البلدية وتوضيح جملة من النقاط المتعلقة بالخدمات الرقمية الجديدة.\n\nتجدون التفاصيل الكاملة في الرابط التالي وعلى موقعنا الرسمي.\n\n#بلاغ #بلدية_قليبية #شفافية",
                "created_time": "2026-04-04T09:00:00+0000",
                "full_picture": "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", 
                "permalink_url": "https://www.facebook.com/MunKelibia/posts/1003"
            },
            {
                "id": "munkel_1004",
                "message": "💡 صيانة شبكة التنوير العمومي بكافة المناطق ⚡\n\nتواصل المصلحة الفنية للأشغال صيانة وإصلاح أعطاب شبكة التنوير العمومي بمختلف أحياء المدينة ونهج المعتمدية والمدخل الجنوبي.\n\nندعو المواطنين للإبلاغ عن أي عطب عبر بوابة المواطن الرقمية.\n\n#أشغال_بلدية #قليبية #تنوير",
                "created_time": "2026-03-28T18:00:00+0000",
                "full_picture": "https://images.unsplash.com/photo-1548543604-a87a9909bfec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", 
                "permalink_url": "https://www.facebook.com/MunKelibia/posts/1004"
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
