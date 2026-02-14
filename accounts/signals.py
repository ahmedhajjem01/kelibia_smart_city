from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser
from .utils import generate_otp, send_otp_sms

@receiver(post_save, sender=CustomUser)
def handle_user_registration(sender, instance, created, **kwargs):
    if created:
        if instance.validation_method == 'sms':
            otp = generate_otp()
            # Update directly to avoid triggering post_save recursively
            CustomUser.objects.filter(id=instance.id).update(otp_code=otp, is_active=False)
            
            # Send SMS
            send_otp_sms(instance.phone, otp)
        elif instance.validation_method == 'email':
            pass
