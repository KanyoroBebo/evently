from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404, render
from django.db.models import Avg
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import *
from vendors.models import *
from users.models import User
import json

@login_required
def events_page(request):
    """Render the events page template"""
    return render(request, 'events/events.html', {'page': 'events'})

@csrf_exempt
@require_POST  
@login_required
def create_booking(request):
    try:
        data = json.loads(request.body)
        vendor_id = data.get('vendor_id')
        event_id = data.get('event_id')
        service_id = data.get('service_id')
        notes = data.get('notes', '')
        
        # Handle event creation if event_name and event_date provided
        event_name = data.get('event_name')
        event_date = data.get('event_date')
        
        if not vendor_id or not service_id:
            return JsonResponse({'error': 'vendor_id and service_id are required.'}, status=400)
        
        # Get or create event
        if event_id:
            event = get_object_or_404(Event, id=event_id)
            # Check if user is the planner of this event
            if request.user != event.planner:
                return JsonResponse({'error': 'Only the event planner can create bookings for this event.'}, status=403)
        elif event_name and event_date:
            # Create a new event for this booking
            if not request.user.is_planner:
                return JsonResponse({'error': 'Only planners can create new events.'}, status=403)
            event = Event.objects.create(
                planner=request.user,
                title=event_name,
                date=event_date,
                location='To be determined'  # Default location
            )
        else:
            return JsonResponse({'error': 'Either event_id or both event_name and event_date are required.'}, status=400)
        
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        service = get_object_or_404(Service, id=service_id, vendor=vendor)
        
        # Check if booking already exists
        existing_booking = VendorBooking.objects.filter(
            event=event,
            vendor=vendor,
            service=service
        ).first()
        
        if existing_booking:
            return JsonResponse({'error': 'Booking already exists for this vendor and service.'}, status=400)
        
        booking = VendorBooking.objects.create(
            event=event,
            vendor=vendor,
            service=service,
            notes=notes
        )
        return JsonResponse({'status': 'pending', 'booking': booking.serialize()}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["PATCH"])
@login_required
def patch_booking(request, booking_id):
    booking = get_object_or_404(VendorBooking, id=booking_id)
    # Only vendor or planner can update status
    user = request.user
    if not (user == booking.event.planner or (hasattr(user, 'vendor_profile') and user.vendor_profile == booking.vendor)):
        return JsonResponse({'error': 'Permission denied.'}, status=403)
    data = json.loads(request.body)
    status = data.get('status')
    if status and status in dict(VendorBooking.STATUS_CHOICES):
        booking.status = status
        booking.save()
        return JsonResponse({'status': status, 'booking': booking.serialize()}, status=200)
    else:
        return JsonResponse({'error': 'Invalid status.'}, status=400)

# Create your views here.
@require_GET
@login_required
def event_list(request):
    events = Event.objects.all()
    
    # Filtering
    date = request.GET.get('date')
    location = request.GET.get('location')
    planner_id = request.GET.get('planner_id')
    mine = request.GET.get('mine')
    
    if date:
        events = events.filter(date__date=date)
    if location:
        events = events.filter(location__icontains=location)
    if planner_id:
        events = events.filter(planner__id=planner_id)
    if mine == '1':
        events = events.filter(planner=request.user)
    
    event_list = []
    for event in events:
        event_list.append({
            'id': event.id,
            'title': event.title,
            'date': event.date,
            'location': event.location,
            'guest_count': event.guests.count(),
            'vendor_count': event.vendor_bookings.count(),
        })
    return JsonResponse({'events': event_list}, status=200)

@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
@login_required
def event_detail(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == "GET":
        return JsonResponse(event.serialize())
    
    elif request.method in ["PATCH", "PUT"]:
        if not request.user.is_planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        data = json.loads(request.body)
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.date = data.get('date', event.date)
        event.location = data.get('location', event.location)
        event.save()
        return JsonResponse(event.serialize())
    
    elif request.method == "DELETE":
        if not request.user.is_planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        event.delete()
        return JsonResponse({'message': 'Event deleted successfully.'})

@require_http_methods(["POST"])
@login_required
def create_event(request):
    if not request.user.is_planner:
        return JsonResponse({"error": "Permission Denied."}, status=403)

    data = json.loads(request.body)
    title = data.get('title')
    description = data.get('description', '')
    date = data.get('date')
    location = data.get('location')
    
    if not title or not date or not location:
        return JsonResponse({'error': 'Title, date, and location are required.'}, status=400)
    
    event = Event.objects.create(
        planner=request.user,
        title=title,
        description=description,
        date=date,
        location=location,
    )
    
    return JsonResponse(event.serialize(), status=201)

@require_http_methods(["GET", "POST"])
@login_required
def event_vendors(request, id):
    event = get_object_or_404(Event, id=id)
    
    if request.method == "GET":
        bookings = event.vendor_bookings.all()
        booking_list = [booking.serialize() for booking in bookings]
        return JsonResponse(booking_list, safe=False)
    
    elif request.method == "POST":
        if request.user != event.planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        data = json.loads(request.body)
        vendor_id = data.get('vendor_id')
        service_id = data.get('service_id')
        status = data.get('status', 'pending')
        notes = data.get('notes', '')
        
        if not vendor_id or not service_id:
            return JsonResponse({'error': 'Vendor ID and Service ID are required.'}, status=400)
        
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        service = get_object_or_404(Service, id=service_id)
        
        booking = VendorBooking.objects.create(
            event=event,
            vendor=vendor,
            service=service,
            status=status,
            notes=notes
        )
        return JsonResponse(booking.serialize(), status=201)

@require_http_methods(["GET", "PATCH", "DELETE"])
@login_required
def booking_detail(request, id, booking_id):
    event = get_object_or_404(Event, id=id)
    booking = get_object_or_404(VendorBooking, id=booking_id, event=event)
    
    if request.method == "GET":
        return JsonResponse(booking.serialize())
    
    elif request.method == "PATCH":
        data = json.loads(request.body)
        status = data.get('status')
        if status and status in dict(VendorBooking.STATUS_CHOICES):
            booking.status = status
            booking.save()
            return JsonResponse({'status': status, 'booking': booking.serialize()}, status=200)
        else:
            return JsonResponse({'error': 'Invalid status.'}, status=400)
    
    elif request.method == "DELETE":
        if not request.user.is_planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        booking.delete()
        return JsonResponse({'message': 'Booking deleted successfully.'})

@require_http_methods(["GET", "POST"])
@login_required
def event_guests(request, id):
    event = get_object_or_404(Event, id=id)
    
    if request.method == "GET":
        guests = event.guests.all()
        guest_list = [guest.serialize() for guest in guests]
        return JsonResponse(guest_list, safe=False)
    
    elif request.method == "POST":
        if request.user != event.planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        email = data.get('email')
        rsvp_status = data.get('rsvp_status', 'invited')
        
        if not name or not email:
            return JsonResponse({'error': 'Name and email are required.'}, status=400)

        user_id = data.get('user_id')
        user = None
        if user_id:
            user = get_object_or_404(User, id=user_id)
            name = user.get_full_name() or user.username
            email = user.email
        guest = Guest.objects.create(
            event=event,
            user=user,
            name=name,
            email=email,
            rsvp_status=rsvp_status
        )
        return JsonResponse(guest.serialize(), status=201)

@require_http_methods(["GET", "PATCH", "DELETE"])
@login_required
def guest_detail(request, id, guest_id):
    event = get_object_or_404(Event, id=id)
    guest = get_object_or_404(Guest, id=guest_id, event=event)
    
    if request.method == "GET":
        return JsonResponse(guest.serialize())
    
    elif request.method == "PATCH":
        if not request.user.is_planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)

        data = json.loads(request.body)
        if guest.user is None:
            guest.name = data.get('name', guest.name)
            guest.email = data.get('email', guest.email)
        guest.rsvp_status = data.get('rsvp_status', guest.rsvp_status)
        guest.save()
        return JsonResponse(guest.serialize())
    
    elif request.method == "DELETE":
        if not request.user.is_planner:
            return JsonResponse({'error': 'Permission denied.'}, status=403)
        
        guest.delete()
        return JsonResponse({'message': 'Guest removed successfully.'})
