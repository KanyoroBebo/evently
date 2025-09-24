from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from vendors.models import VendorProfile
@receiver(post_save, sender=User)
def create_vendor_profile(sender, instance, created, **kwargs):
    if created and instance.is_vendor:
        VendorProfile.objects.create(user=instance)
    elif not created and instance.is_vendor:
        VendorProfile.objects.get_or_create(user=instance)


