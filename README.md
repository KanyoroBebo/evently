# Evently

**Evently is a two-sided event-planning marketplace connecting planners with professional vendors, providing a complete booking and guest-management workflow.**

Evently solves the complex challenge of event planning by connecting event planners with professional vendors in a streamlined marketplace. The platform eliminates the friction of vendor discovery, booking coordination, and guest management by providing a centralized hub where planners can create events, browse categorized vendors, manage bookings, and coordinate guest lists while vendors showcase their services and manage their business through a professional dashboard. It's designed for easy deployment to platforms such as Heroku or DigitalOcean.

---

## CS50W Final Project Requirements

**This project fulfills all CS50W Final Project requirements with a unique two-sided marketplace concept, advanced Django backend, comprehensive REST API, and sophisticated frontend JavaScript implementation.**

---

**Live Demo Features:**
- Create planner and vendor accounts to test both user flows
- Sample categories and vendors can be created via Django Admin
- Full booking workflow from vendor discovery to completion
- Guest management with real-time RSVP updates
- Interactive category filtering with smooth animations

**Project Highlights:**
This project demonstrates advanced Django development patterns, complex database relationships, comprehensive REST API design, and sophisticated frontend JavaScript programming while solving a real-world problem in the event planning industry.

---

## Distinctiveness and Complexity

Evently represents a significant departure from previous CS50W projects through its sophisticated **two-sided marketplace architecture** and comprehensive **event management ecosystem**. Unlike previous projects which focused on single-user interactions, Evently implements a complex multi-role system where planners and vendors have entirely different workflows, permissions, and user experiences.

**Technical Complexity:**
- **Custom User Role System**: Extends Django's AbstractUser with `is_vendor` and `is_planner` flags, implementing role-based permissions and view access control throughout the application
- **Complex Relational Database Design**: Features interconnected models (Users, Events, VendorProfiles, Services, ServiceCategories, VendorBookings, Guests, Reviews, PortfolioItems) with sophisticated foreign key relationships and cascading behaviors
- **RESTful API Architecture**: Implements a complete REST API with 15+ endpoints supporting CRUD operations, status management, and real-time updates with proper HTTP status codes and error handling
- **Advanced Frontend JavaScript**: 1,293 lines of vanilla JavaScript managing complex state, real-time UI updates, modal interactions, AJAX requests, error handling, and responsive category filtering
- **File Upload System**: Django media handling for vendor profile pictures and portfolio images with proper validation and fallback mechanisms
- **Dynamic Status Management**: Real-time booking status updates (pending → confirmed → completed) and RSVP management (invited → attending/declined/waitlist) with instant UI feedback

**Distinctive Features:**
- **Vendor Dashboard**: Professional interface for vendors to manage bookings, update statuses, and track business metrics
- **Interactive Category Filtering**: Real-time vendor filtering with smooth animations, URL state management, and responsive design
- **Guest Management System**: Complete RSVP workflow with status updates, duplicate prevention, and email validation
- **Booking Workflow**: End-to-end vendor booking process from discovery to completion with status tracking
- **Mobile-First Responsive Design**: Bootstrap 5 with custom CSS animations, loading states, and touch-optimized interactions

---

## Project Overview

**Purpose:**
The platform provides a centralized hub for event planning, eliminating friction in vendor discovery, booking coordination, and guest management.

**Key Features:**

* **Dual User Roles**: Separate registration and authentication flows for planners and vendors with role-based permissions
* **Event Creation & Management**: Complete event lifecycle management with date/time, location, description, and guest tracking
* **Vendor Discovery**: Browse vendors by category (catering, photography, venues, music, florists) with search and filtering
* **Service Booking System**: End-to-end booking workflow with service selection, event association, and status tracking
* **Real-time Status Updates**: Dynamic booking status management (pending/confirmed/cancelled/completed) with instant UI updates
* **Guest Management**: Add guests, manage RSVP status (invited/attending/declined/waitlist), and track responses in real-time
* **Vendor Dashboard**: Professional interface for vendors to view bookings, update statuses, and manage their business
* **Category Filtering**: Interactive category buttons with smooth animations and URL state persistence
* **File Upload System**: Vendor profile pictures and portfolio management with image fallbacks
* **Responsive Design**: Mobile-first Bootstrap 5 interface with custom animations and loading states
* **Toast Notification System**: User-friendly feedback for all actions with color-coded success/error messages
* **Review System**: Vendor ratings and reviews with average rating calculations

---

## File Structure

```
evently/
│
├─ evently/                    # Django project configuration
│  ├─ settings.py             # Project settings, database, media configuration
│  ├─ urls.py                 # Main URL routing, app includes
│  ├─ wsgi.py & asgi.py       # Production server configuration
│  └─ __init__.py
│
├─ users/                      # User management and authentication
│  ├─ models.py               # Custom User model with vendor/planner roles
│  ├─ views.py                # Authentication, registration, profile views
│  ├─ urls.py                 # User-related URL patterns
│  ├─ admin.py                # Django admin configuration
│  ├─ signals.py              # User post-save signal handlers
│  └─ migrations/             # Database migration files
│
├─ vendors/                    # Vendor management and marketplace
│  ├─ models.py               # VendorProfile, Service, ServiceCategory, Review, PortfolioItem models
│  ├─ views.py                # Vendor API endpoints, dashboard, profile management (292 lines)
│  ├─ urls.py                 # Vendor-related URL patterns (18 endpoints)
│  └─ migrations/             # Database migration files
│
├─ events/                     # Event and booking management
│  ├─ models.py               # Event, VendorBooking, Guest models with status choices
│  ├─ views.py                # Event CRUD, booking management, guest management APIs
│  ├─ urls.py                 # Event-related URL patterns
│  └─ migrations/             # Database migration files (2 migrations)
│
├─ templates/                  # HTML templates
│  ├─ layout.html             # Base template with Bootstrap 5, navigation, toast container
│  ├─ users/                  # User-specific templates
│  │  ├─ index.html           # Homepage with featured vendors, categories, call-to-action
│  │  ├─ login.html           # Authentication form
│  │  └─ register.html        # Registration with role selection
│  ├─ vendors/                # Vendor-specific templates
│  │  └─ vendors.html         # Vendor browsing page with category filters and booking modal
│  └─ events/                 # Event-specific templates (if any)
│
├─ static/                     # Static assets
│  ├─ css/
│  │  ├─ bootstrap.css        # Bootstrap 5 framework
│  │  └─ styles.css           # Custom styles (195 lines) - animations, loading states, category buttons
│  ├─ js/
│  │  ├─ main.js              # Core application logic (1,293 lines) - API calls, UI management, events
│  │  └─ img/                 # JavaScript-related images and fallbacks
│  └─ [other static files]
│
├─ vendor_portfolio/           # User-uploaded vendor portfolio images
├─ media/                      # Django media root for file uploads
├─ requirements.txt            # Python dependencies (Django 5.1.1, Pillow 10.4.0)
├─ manage.py                   # Django management script
├─ db.sqlite3                  # SQLite database (development)
└─ README.md                   # Project documentation
```

---

## Installation & Setup

**Prerequisites:** Python 3.8+, Django 5.1+

1. **Clone Repository**

   ```bash
   git clone <https://github.com/KanyoroBebo/evently.git>
   cd evently
   ```

2. **Create and Activate Virtual Environment**

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```
   
   *Core dependencies: Django 5.1.1, Pillow (for image handling)*

4. **Configure Database**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create Superuser (Recommended)**

   ```bash
   python manage.py createsuperuser
   ```

6. **Create Sample Data (Optional)**
   
   Access Django Admin at `/admin/` to create:
   - Sample service categories (Catering, Photography, Venues, Music, Florists)
   - Sample vendor profiles with services
   - Test events and bookings

7. **Run Development Server**

   ```bash
   python manage.py runserver
   ```
   
   Access the application at `http://127.0.0.1:8000/`

---

## Usage

### For Event Planners:

1. **Registration & Login**
   - Register at `/users/register/` and select "Event Planner" role
   - Login to access planner-specific features

2. **Event Management**
   - Create events from the homepage or events page
   - Add event details: title, date/time, location, description
   - Manage guest lists with RSVP tracking (invited/attending/declined/waitlist)
   - Update guest RSVP status in real-time via dropdown selectors

3. **Vendor Discovery & Booking**
   - Browse vendors on homepage or `/vendors/page/`
   - Filter vendors by category using interactive category buttons
   - View vendor profiles, services, and ratings
   - Book vendors: select service, associate with event, add notes
   - Track booking status: pending → confirmed → completed
   - Manage multiple vendor bookings per event

### For Vendors:

1. **Registration & Setup**
   - Register and select "Vendor" role
   - Complete vendor profile: business name, description, location, profile picture
   - Create service offerings with categories and pricing

2. **Business Management**
   - Access vendor dashboard at `/vendors/dashboard/`
   - View incoming booking requests
   - Update booking statuses (confirm, cancel, complete)
   - Manage service portfolio and business information

### Key User Flows:

- **Homepage**: Features vendor showcase, category browsing, and quick access to planning tools
- **Vendor Page**: Category filtering, vendor cards with booking buttons, responsive design
- **Event Dashboard**: Complete event overview with guest and vendor management modals
- **Mobile Experience**: Fully responsive design optimized for mobile event planning

---

## Technologies Used

### Backend:
* **Django 5.1.1** - Web framework with custom user models, signal handling, and admin interface
* **Python 3.8+** - Core programming language
* **SQLite** - Development database with complex relational schema
* **Django ORM** - Database abstraction with advanced querying and aggregations
* **Pillow** - Python imaging library for profile picture and portfolio uploads

### Frontend:
* **HTML5** - Semantic markup with accessibility considerations
* **Bootstrap 5.3.2** - Responsive CSS framework with custom component styling
* **Vanilla JavaScript** - 1,293 lines of custom JavaScript with no external frameworks
* **CSS3** - Custom animations, loading states, transitions, and responsive design
* **Bootstrap Icons** - Consistent iconography throughout the interface

### API & Architecture:
* **RESTful API Design** - Custom REST endpoints with proper HTTP methods and status codes
* **AJAX with Fetch API** - Asynchronous requests for smooth user experience
* **CSRF Protection** - Django's built-in CSRF tokens for secure form submissions
* **Session-based Authentication** - Django's authentication system with role-based access

### Development Tools:
* **Django Admin** - Administrative interface for content management
* **Django Migrations** - Database schema version control
* **Django Static Files** - Asset management and serving
* **Django Media Handling** - File upload and image processing

---

## Additional Information

### Project Scope & Complexity:
- **1,293 lines** of custom JavaScript handling complex UI interactions and state management
- **292 lines** of Django views implementing comprehensive REST API endpoints
- **10+ database models** with sophisticated relationships and custom serialization methods
- **Mobile-first responsive design** with custom CSS animations and loading states
- **Real-time UI updates** using AJAX and DOM manipulation without external frameworks

### Notable Technical Implementations:
- **Custom User Role System**: Extends Django's AbstractUser with role-based view restrictions
- **Dynamic Category Filtering**: URL state management with smooth animations and loading states
- **Toast Notification System**: Custom implementation with color-coded feedback for user actions
- **Event Delegation**: Efficient JavaScript event handling for dynamic content
- **Image Upload System**: Django media handling with fallback mechanisms and validation
- **Complex Database Relationships**: Foreign keys, cascading deletes, and aggregated data queries

### Security Features:
- **CSRF Protection**: All forms and AJAX requests include Django CSRF tokens
- **Role-based Access Control**: Strict permission checking in views and templates
- **Input Validation**: Server-side validation for all user inputs and file uploads
- **SQL Injection Prevention**: Django ORM prevents SQL injection attacks

### Known Limitations:
- **Payment Processing**: Not implemented (would require Stripe/PayPal integration)
- **Email Notifications**: RSVP and booking confirmations are visual-only
- **Advanced Search**: Basic category filtering only (no price range, location radius, availability)
- **Real-time Messaging**: No direct communication between planners and vendors

### Future Enhancements:
- Payment gateway integration for booking deposits
- Email notification system for status updates
- Calendar integration for availability management
- Advanced search filters and vendor comparison tools
- Messaging system for planner-vendor communication
- Event timeline and planning checklist features

### Development Notes:
- Built with Django development server in mind
- SQLite database suitable for development/demonstration
- Bootstrap CDN used for faster development (can be localized for production)
- All custom JavaScript is vanilla (no jQuery, React, or Vue dependencies)
- Designed for easy deployment to platforms like Heroku or DigitalOcean
