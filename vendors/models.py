from django.db import models
from django.db.models import Avg

# Create your models here.
class VendorProfile(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='vendor_profile')
    business_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    contact_info = models.CharField(max_length=255, blank=True, null=True)
    profile_pic = models.ImageField(upload_to='vendor_profiles/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name

    def serialize(self):
        avg_rating = self.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        return {
            'id': self.id,
            'business_name': self.business_name,
            'profile_pic': self.profile_pic.url if self.profile_pic else None,
            'description': self.description,
            'location': self.location,
            'average_rating': round(avg_rating, 2),
            'services_count': self.services.count(),
            'portfolio_count': self.portfolio_items.count(),
            'reviews_count': self.reviews.count(),
        }
    
class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name
    
class Service(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='services')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    availability_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.vendor.business_name}"
    
    def serialize(self):
        return {
            'id': self.id,
            'vendor': self.vendor.business_name,
            'category': self.category.name if self.category else None,
            'title': self.title,
            'description': self.description,
            'price': str(self.price),
            'availability_notes': self.availability_notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class PortfolioItem(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='portfolio_items')
    image = models.FileField(upload_to='vendor_portfolio/', blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Portfolio Item for {self.vendor.business_name}" 
    
    def serialize(self):
        return {
            'id': self.id,
            'vendor': self.vendor.business_name,
            'image': self.image.url if self.image else None,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
        }

class Review(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.vendor.business_name} by {self.user.username}"
    
    def serialize(self):
        return {
            'id': self.id,
            'vendor': self.vendor.business_name,
            'vendor_id': self.vendor.id,
            'user': self.user.username,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat(),
        }