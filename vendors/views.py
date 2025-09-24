from django.shortcuts import render
from django.views.decorators.http import require_GET
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from .models import *
from events.models import VendorBooking
import json

# Create your views here.
def vendors_page(request):
    # Fetch all categories for filter buttons
    categories = ServiceCategory.objects.all()
    category_list = [
        {
            'id': cat.id,
            'name': cat.name,
            'description': cat.description
        } for cat in categories
    ]
    
    return render(request, 'vendors/vendors.html', {
        'page': 'vendors',
        'category_list': category_list
    })

@login_required
def vendor_dashboard(request):
    if not request.user.is_vendor:
        return JsonResponse({'error': 'Access denied. Vendor account required.'}, status=403)

    try:
        vendor_profile = request.user.vendor_profile
    except VendorProfile.DoesNotExist:
        return JsonResponse({'error': 'Vendor profile not found.'}, status=404)

    return render(request, 'vendors/dashboard.html', {
        'page': 'vendor-dashboard',
        'vendor': vendor_profile
    })

@require_GET
@login_required
def vendor_bookings(request):
    # Get all bookings for the logged-in vendor
    if not request.user.is_vendor:
        return JsonResponse({'error': 'Access denied. Vendor account required.'}, status=403)
    
    try:
        vendor_profile = request.user.vendor_profile
    except VendorProfile.DoesNotExist:
        return JsonResponse({'error': 'Vendor profile not found.'}, status=404)
    
    bookings = VendorBooking.objects.filter(vendor=vendor_profile).order_by('-created_at')
    booking_list = [booking.serialize() for booking in bookings]
    
    return JsonResponse({'bookings': booking_list}, status=200)

@require_GET
def categories(request):
    cats = ServiceCategory.objects.all()
    data = [
        {
            'id': cat.id,
            'name': cat.name,
            'description': cat.description
        } for cat in cats
    ]
    return JsonResponse(data, safe=False, status=200)

@require_GET
def vendors(request):
    category = request.GET.get('category')
    location = request.GET.get('location')
    price_min = request.GET.get('price_min')
    price_max = request.GET.get('price_max')
    vendors = VendorProfile.objects.all()
    if category:
        # Try filtering by category ID first, then by name for backward compatibility
        try:
            category_id = int(category)
            vendors = vendors.filter(services__category__id=category_id).distinct()
        except (ValueError, TypeError):
            # If category is not a number, filter by name
            vendors = vendors.filter(services__category__name__icontains=category).distinct()
    if location:
        vendors = vendors.filter(location__icontains=location)
    if price_min:
        vendors = vendors.filter(services__price__gte=price_min).distinct()
    if price_max:
        vendors = vendors.filter(services__price__lte=price_max).distinct() 
    vendor_list = []
    for vendor in vendors:
        data = vendor.serialize()
        avg_rating = vendor.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        data['average_rating'] = round(avg_rating, 2)
        vendor_list.append(data)
    return JsonResponse({'vendors': vendor_list}, status=200)

@require_GET
def vendor_detail(request, id):
    vendor = get_object_or_404(VendorProfile, id=id)
    data = vendor.serialize()
    # Add services list
    data['services'] = [service.serialize() for service in vendor.services.all()]
    return JsonResponse({'vendor': data}, status=200)

@login_required
@require_http_methods(["GET", "PATCH"])
def vendor_profile(request):
    try:
        vendor = request.user.vendor_profile
    except VendorProfile.DoesNotExist:
        return JsonResponse({'error': 'Vendor profile not found.'}, status=404)
    
    if request.method == "GET":
        data = vendor.serialize()
        return JsonResponse({'vendor': data}, status=200)
    
    elif request.method == "PATCH":
        data = json.loads(request.body)
        business_name = data.get('business_name')
        description = data.get('description')
        location = data.get('location')
        contact_info = data.get('contact_info')
        
        if business_name:
            vendor.business_name = business_name
        if description:
            vendor.description = description
        if location:
            vendor.location = location
        if contact_info:
            vendor.contact_info = contact_info
        
        vendor.save()
        return JsonResponse({'message': 'Vendor profile updated successfully.'}, status=200)

@login_required
@require_http_methods(["GET", "POST"])
def services(request, id):
    vendor = get_object_or_404(VendorProfile, id=id)
    
    if request.method == "GET":
        services = vendor.services.all()
        service_list = [service.serialize() for service in services]
        return JsonResponse({'services': service_list}, status=200)
    
    elif request.method == "POST":
        if request.user != vendor.user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category_name = data.get('category')
        availability_notes = data.get('availability_notes', '')
        if not title or not description or price is None:
            return JsonResponse({'error': 'Title, description, and price are required.'}, status=400)
        category = None
        if category_name:
            category, created = ServiceCategory.objects.get_or_create(name=category_name)
        service = Service.objects.create(
            vendor=vendor,
            title=title,
            description=description,
            price=price,
            category=category,
            availability_notes=availability_notes
        )
        return JsonResponse({'service': service.serialize()}, status=201)

@login_required
@require_http_methods(["GET", "PATCH", "DELETE"])
def service_detail(request, id, service_id):
    vendor = get_object_or_404(VendorProfile, id=id)
    service = get_object_or_404(Service, id=service_id, vendor=vendor)
    
    if request.method == "GET":
        return JsonResponse({'service': service.serialize()}, status=200)
    
    elif request.method == "PATCH":
        if request.user != vendor.user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category_name = data.get('category')
        availability_notes = data.get('availability_notes')
        if title:
            service.title = title
        if description:
            service.description = description
        if price is not None:
            service.price = price
        if category_name:
            category, created = ServiceCategory.objects.get_or_create(name=category_name)
            service.category = category
        if availability_notes is not None:
            service.availability_notes = availability_notes
        service.save()
        return JsonResponse({'service': service.serialize()}, status=200)
    
    elif request.method == "DELETE":
        if request.user != vendor.user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        service.delete()
        return JsonResponse({'message': 'Service deleted successfully.'}, status=200)

@login_required
@require_http_methods(["GET", "POST"])
def portfolio(request, id):
    vendor = get_object_or_404(VendorProfile, id=id)
    
    if request.method == "GET":
        items = vendor.portfolio_items.all()
        item_list = [item.serialize() for item in items]
        return JsonResponse({'portfolio_items': item_list}, status=200)
    elif request.method == "POST":
        if request.user != vendor.user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        image = request.FILES.get('image')
        description = request.POST.get('description', '')

        if not image or not description:
            return JsonResponse({'error': 'Image/file and description and required.'}, status=400)
        item = PortfolioItem.objects.create(
            vendor=vendor,
            image=image,
            description=description
        )
        return JsonResponse({'portfolio_item': item.serialize()}, status=201)

@login_required
@require_http_methods(["GET", "DELETE"])
def portfolio_detail(request, id, item_id):
    vendor = get_object_or_404(VendorProfile, id=id)
    item = get_object_or_404(PortfolioItem, id=item_id, vendor=vendor)
    
    if request.method == "GET":
        return JsonResponse({'portfolio_item': item.serialize()}, status=200)
    
    elif request.method == "DELETE":
        if request.user != vendor.user:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        item.delete()
        return JsonResponse({'message': 'Portfolio item deleted successfully.'}, status=200)  

@login_required
@require_http_methods(["GET", "POST"])
def reviews(request, id):
    vendor = get_object_or_404(VendorProfile, id=id)
    
    if request.method == "GET":
        reviews = vendor.reviews.all().select_related('user')
        review_list = [review.serialize() for review in reviews]
        return JsonResponse({'reviews': review_list}, status=200)
    
    elif request.method == "POST":
        data = json.loads(request.body)
        rating = data.get('rating')
        comment = data.get('comment', '')
        if rating is None or not (1 <= rating <= 5):
            return JsonResponse({'error': 'Rating must be between 1 and 5.'}, status=400)
        existing_review = Review.objects.filter(vendor=vendor, user=request.user).first()
        if existing_review:
            return JsonResponse({'error': 'You have already reviewed this vendor.'}, status=400)
        review = Review.objects.create(
            vendor=vendor,
            user=request.user,
            rating=rating,
            comment=comment
        )    
        return JsonResponse({'review': review.serialize()}, status=201)

@login_required
@require_http_methods(["GET", "DELETE"])
def review_detail(request, id, review_id):
    vendor = get_object_or_404(VendorProfile, id=id)
    review = get_object_or_404(Review, id=review_id, vendor=vendor)
    
    if request.method == "GET":
        return JsonResponse({'review': review.serialize()}, status=200)
    
    elif request.method == "DELETE":
        if request.user != review.user and not request.user.is_staff:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        review.delete()
        return JsonResponse({'message': 'Review deleted successfully.'}, status=200)
