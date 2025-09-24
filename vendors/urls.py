from django.urls import path
from . import views

urlpatterns = [
    path('page/', views.vendors_page, name='vendors-page'),
    path('dashboard/', views.vendor_dashboard, name='vendor-dashboard'),
    path('dashboard/bookings/', views.vendor_bookings, name='vendor-bookings'),
    path('categories/', views.categories, name='categories'),
    path('', views.vendors, name='vendors'),
    path('<int:id>/', views.vendor_detail, name='vendor-detail'),
    path('me/', views.vendor_profile, name='vendor-profile'),
    path('<int:id>/services/', views.services, name='services'),
    path('<int:id>/services/<int:service_id>/', views.service_detail, name='service-detail'),
    path('<int:id>/portfolio/', views.portfolio, name='portfolio'),
    path('<int:id>/portfolio/<int:item_id>/', views.portfolio_detail, name='portfolio-detail'),
    path('<int:id>/reviews/', views.reviews, name='reviews'),
    path('<int:id>/reviews/<int:review_id>/', views.review_detail, name='review-detail'),
]