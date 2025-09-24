from django.db import models

# Create your models here.
class Event(models.Model):
    planner = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} on {self.date.strftime('%Y-%m-%d')}"

    def serialize(self):
        return {
            'id': self.id,
            'planner': self.planner.username,
            'title': self.title,
            'description': self.description,
            'date': self.date.strftime('%B %d, %Y'),
            'location': self.location,
            'guest_count': self.guests.count(),
            'vendor_count': self.vendor_bookings.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class VendorBooking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='vendor_bookings')
    vendor = models.ForeignKey('vendors.VendorProfile', on_delete=models.CASCADE, related_name='vendor_bookings')
    service = models.ForeignKey('vendors.Service', on_delete=models.CASCADE, related_name='vendor_bookings')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.business_name} - {self.service.title} for {self.event.title} ({self.status})"
    
    def serialize(self):
        return {
            'id': self.id,
            'event': self.event.serialize(),
            'vendor': self.vendor.serialize(),  
            'service': self.service.serialize(),
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class Guest(models.Model):
    RSVP_CHOICES = [
        ('invited', 'Invited'),
        ('attending', 'Attending'),
        ('declined', 'Declined'),
        ('waitlist', 'Waitlist'),
    ]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='guests')
    user = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='invited_events')
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField()
    rsvp_status = models.CharField(max_length=10, choices=RSVP_CHOICES, default='invited')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name or self.email} ({self.rsvp_status}) for {self.event.title}"

    def serialize(self):
        return {
            'id': self.id,
            'event': self.event.title,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.get_full_name()
            } if self.user else None,
            'name': self.name,
            'email': self.email,
            'rsvp_status': self.rsvp_status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }