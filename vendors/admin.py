from django.contrib import admin
from .models import VendorProfile, ServiceCategory, Service, PortfolioItem, Review

# Register your models here.
admin.site.register(VendorProfile)
admin.site.register(ServiceCategory)
admin.site.register(Service)
admin.site.register(PortfolioItem)
admin.site.register(Review)