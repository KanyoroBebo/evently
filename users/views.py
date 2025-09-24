from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import *
import json
# Create your views here.

# Template-based views
def index(request):
    return render(request, "users/index.html", { "page": "index" })

def register_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        is_vendor = request.POST.get("is_vendor") == "on"
        is_planner = request.POST.get("is_planner") == "on"

        if not username or not email or not password:
            messages.error(request, "All fields are required.")
            return redirect("register")

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_vendor=is_vendor,
                is_planner=is_planner
            )
            user.save()
            login(request, user)
            return redirect("index")
        except IntegrityError:
            messages.error(request, "Username already exists.")
            return redirect("register")
    return render(request, "users/register.html", { "page": "register" })

def login_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        if not username or not password:
            messages.error(request, "Username and password required.")
            return redirect("login")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("index")
        else:
            messages.error(request, "Invalid username or password.")
            return redirect("login")
    return render(request, "users/login.html", { "page": "login" })

@login_required
def logout_page(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("index")

@login_required
def profile(request):
    user = request.user

    if request.method == "GET":
        return JsonResponse({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_vendor": user.is_vendor,
            "is_planner": user.is_planner
        })

    elif request.method == "PATCH":
        data = json.loads(request.body)
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.email = data.get("email", user.email)
        # Add other fields as necessary

        user.save()
        return JsonResponse({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_vendor": user.is_vendor,
            "is_planner": user.is_planner
        })

    else:
        return JsonResponse({"error": "Method not allowed."}, status=405)

'''
@csrf_exempt
@require_POST
def register(request):
    data = json.loads(request.body)
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    is_vendor = data.get("is_vendor", False)
    is_planner = data.get("is_planner", False)

    if not username or not email or not password:
        return JsonResponse({"error": "Username, email, and password are required."}, status=400)

    try:
        user = User.objects.create_user(username=username, email=email, password=password, is_vendor=is_vendor, is_planner=is_planner)
        user.save()
        return JsonResponse({
            "message": "User registered successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_vendor": user.is_vendor,
                "is_planner": user.is_planner
            }
        }, status=201)
    except IntegrityError:
        return JsonResponse({"error": "Username already taken."}, status=400)

@require_POST
@csrf_exempt
def login_view(request):
    data = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"error": "Username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return JsonResponse({
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_vendor": user.is_vendor,
                "is_planner": user.is_planner
            }
        })
    else:
        return JsonResponse({"error": "Invalid credentials."}, status=401)

@require_POST
@login_required
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logout successful."})


    Remember to add
        Password change/reset
        Add support in profile/ for logged-in users to change their password (old → new).
        Add a separate password reset flow (forgot password via email + token).
        Permissions
        Enforce role-based access:
        Vendors: manage vendor profiles, accept bookings.
        Customers: create events, send bookings, leave reviews.
        Deny access (403 Forbidden) if wrong role tries to access.
'''