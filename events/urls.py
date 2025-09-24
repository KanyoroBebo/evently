from django.urls import path
from . import views

urlpatterns = [
    path("", views.event_list, name="event_list"),
    path("page/", views.events_page, name="events_page"),
    path("create/", views.create_event, name="create_event"),
    path("<int:event_id>/", views.event_detail, name="event_detail"),
    path("<int:id>/vendors/", views.event_vendors, name="event_vendors"),
    path("<int:id>/vendors/<int:booking_id>/", views.booking_detail, name="booking_detail"),
    path("<int:id>/guests/", views.event_guests, name="event_guests"),
    path("<int:id>/guests/<int:guest_id>/", views.guest_detail, name="guest_detail"),
    path("bookings/", views.create_booking, name="create_booking"),
    path("bookings/<int:booking_id>/", views.patch_booking, name="patch_booking"),
]