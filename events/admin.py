from django.contrib import admin
from .models import Event, VendorBooking, Guest

# Register your models here.
admin.site.register(Event)
admin.site.register(VendorBooking)
admin.site.register(Guest)