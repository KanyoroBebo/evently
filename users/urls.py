from django.urls import path
from . import views

urlpatterns = [
    # Template-based auth
    path("login/", views.login_page, name="login"),
    path("logout/", views.logout_page, name="logout"),
    path("register/", views.register_page, name="register"),
    
    # API endpoints for user management
#    path('login/', views.login_view, name='login'),
#    path('logout/', views.logout_view, name='logout'),
#    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
]