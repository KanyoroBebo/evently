const API_BASE_URL = '/';
let currentBookingVendorId = null;

// CSRF Helper with multiple fallbacks
function getCSRFToken() {
    // Method 1: Cookie (most common in Django)
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    
    // Method 2: Meta tag fallback
    const csrfMeta = document.querySelector('meta[name=csrf-token]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    // Method 3: Hidden form input fallback
    const csrfInput = document.querySelector('input[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        return csrfInput.value;
    }
    
    // Method 4: Check for Django's CSRF token in any form
    const anyCSRFInput = document.querySelector('[name="csrfmiddlewaretoken"]');
    if (anyCSRFInput) {
        return anyCSRFInput.value;
    }
    
    return '';
}

// Validate CSRF token availability
function validateCSRFToken() {
    const token = getCSRFToken();
    if (!token) {
        console.warn('CSRF token not found. This may cause authentication issues.');
        return false;
    }
    return true;
}

// Toast notification functions
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toastElement || !toastMessage) {
        console.error('Toast elements not found');
        return;
    }
    
    // Set message
    toastMessage.textContent = message;
    
    // Set title and styling based on type
    const toastHeader = toastElement.querySelector('.toast-header');
    toastHeader.className = 'toast-header'; // Reset classes
    
    switch (type) {
        case 'success':
            toastTitle.textContent = 'Success';
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastTitle.textContent = 'Error';
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastTitle.textContent = 'Warning';
            toastHeader.classList.add('bg-warning');
            break;
        default:
            toastTitle.textContent = 'Evently';
            break;
    }
    
    // Show the toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showWarningToast(message) {
    showToast(message, 'warning');
}

// Handle authentication errors (401/403)
function handleAuthError(response) {
    if (response.status === 401) {
        showErrorToast('Your session has expired. Redirecting to login...');
        setTimeout(() => {
            window.location.href = '/users/login/';
        }, 2000);
        return true;
    } else if (response.status === 403) {
        showErrorToast('Access denied. You don\'t have permission for this action.');
        return true;
    }
    return false;
}

// Button loading state utilities
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.classList.add('btn-loading');
        button.dataset.originalText = button.textContent;
        button.textContent = '';
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

function setElementLoading(element, loading = true) {
    if (loading) {
        element.classList.add('loading-overlay');
    } else {
        element.classList.remove('loading-overlay');
    }
}

// Image fallback handling
function handleImageError(img, fallbackText = 'Image not available') {
    img.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'img-fallback';
    fallback.style.width = img.style.width || '100px';
    fallback.style.height = img.style.height || '100px';
    fallback.setAttribute('data-fallback-text', fallbackText);
    img.parentNode.insertBefore(fallback, img.nextSibling);
}

// Initialize image error handlers for dynamically added images
function initImageFallbacks() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            handleImageError(e.target);
        }
    }, true);
}

// Show/hide create event form
function showCreateEventForm() {
    const form = document.getElementById('create-event-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize create event form functionality
function initializeCreateEventForm() {
    const form = document.getElementById('create-event-form-element'); // Updated ID to match template
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            location: formData.get('location')
        };
        
        // Validate required fields
        if (!eventData.title || !eventData.date || !eventData.location) {
            showFormError('create-event-error', 'Title, date, and location are required.');
            return;
        }
        
        // Validate CSRF token
        if (!validateCSRFToken()) {
            showFormError('create-event-error', 'Security validation failed. Please refresh the page and try again.');
            return;
        }
        
        // Submit event creation
        fetch('/events/create/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to create event');
                });
            }
            return response.json();
        })
        .then(newEvent => {
            // Success - add event to the list and reset form
            addEventToList(newEvent);
            form.reset();
            hideFormError('create-event-error');
            showCreateEventForm(); // Hide the form
        })
        .catch(error => {
            showFormError('create-event-error', error.message);
        });
    });
}

// Show form error message
function showFormError(errorId, message) {
    const errorDiv = document.getElementById(errorId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

// Hide form error message
function hideFormError(errorId) {
    const errorDiv = document.getElementById(errorId);
    if (errorDiv) {
        errorDiv.classList.add('d-none');
    }
}

// Add new event to the events list
function addEventToList(event) {
    const container = document.getElementById('events-section');
    if (!container) return;
    
    // If container shows "no events" message, replace it
    if (container.textContent.includes('No events found')) {
        container.innerHTML = '';
    }
    
    const eventCard = `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">
                        <i class="bi bi-calendar"></i> ${event.date || 'Date TBD'}<br>
                        <i class="bi bi-geo-alt"></i> ${event.location || 'Location TBD'}<br>
                        <i class="bi bi-people"></i> 0 guests<br>
                        <i class="bi bi-briefcase"></i> 0 vendors
                    </p>
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewEventGuests(${event.id})">
                            Guests
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewEventVendors(${event.id})">
                            Vendors
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', eventCard);
}

// Page Initializers
function indexPage() {
    fetchCategories();
    // Only fetch events and initialize form if user is authenticated
    if (document.getElementById('events-section')) {
        fetchEvents();
        initializeCreateEventForm();
    }
}

function vendorsPage() {
    const section = document.getElementById('vendors-section');
    const loading = document.getElementById('vendors-loading');
    const errorDiv = document.getElementById('vendors-error');
    if (!section) {
        if (errorDiv) {
            errorDiv.textContent = "Sorry, we couldn't load the vendors section at this time. Please try refreshing the page.";
            errorDiv.classList.remove('d-none');
        } else {
            console.error("Vendors section could not be loaded.");
        }
        if (loading) loading.style.display = 'none';
        return;
    }
    // Show loading
    if (loading) loading.style.display = '';
    if (errorDiv) errorDiv.classList.add('d-none');

    // Get category from query param
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    let url = '/vendors/';
    if (category) url += `?category=${encodeURIComponent(category)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch vendors');
            return response.json();
        })
        .then(data => {
            // API returns {vendors: [...]} or just [...]
            const vendors = Array.isArray(data) ? data : data.vendors;
            renderVendors(vendors);
            
            // Initialize category button states
            initializeCategoryButtons(category);
        })
        .catch(err => {
            if (errorDiv) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('d-none');
            }
        })
        .finally(() => {
            if (loading) loading.style.display = 'none';
        });
}

function filterVendorsByCategory(categoryId, buttonElement = null) {
    const section = document.getElementById('vendors-section');
    const loading = document.getElementById('vendors-loading');
    const errorDiv = document.getElementById('vendors-error');
    
    if (!section) return;
    
    // Show loading
    if (loading) loading.style.display = '';
    if (errorDiv) errorDiv.classList.add('d-none');
    
    // Build URL with category filter
    let url = '/vendors/';
    if (categoryId && categoryId !== 'all') {
        url += `?category=${encodeURIComponent(categoryId)}`;
    }
    
    // Update URL without page reload
    const newUrl = categoryId && categoryId !== 'all' 
        ? `/vendors/?category=${encodeURIComponent(categoryId)}`
        : '/vendors/';
    window.history.pushState({}, '', newUrl);
    
    // Fetch filtered vendors
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch vendors');
            return response.json();
        })
        .then(data => {
            // API returns {vendors: [...]} or just [...]
            const vendors = Array.isArray(data) ? data : data.vendors;
            renderVendors(vendors);
        })
        .catch(err => {
            if (errorDiv) {
                errorDiv.textContent = `Failed to filter vendors: ${err.message}`;
                errorDiv.classList.remove('d-none');
            }
        })
        .finally(() => {
            if (loading) loading.style.display = 'none';
            if (buttonElement) buttonElement.classList.remove('loading');
        });
}

function initializeCategoryButtons(activeCategory) {
    // Reset all buttons to inactive state
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('btn-outline-primary');
        btn.classList.remove('btn-primary');
    });
    
    // Set active button based on current category
    let activeButton;
    if (activeCategory) {
        activeButton = document.querySelector(`[data-category="${activeCategory}"]`);
    }
    
    // If no specific category or button not found, default to "All Categories"
    if (!activeButton) {
        activeButton = document.querySelector('[data-category="all"]');
    }
    
    // Set active state
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.classList.remove('btn-outline-primary');
        activeButton.classList.add('btn-primary');
    }
}

function eventsPage() {
    // Initialize events page - show user's events and event creation form
    fetchEvents();
    
    // Initialize create event form handler
    initializeCreateEventForm();
}

function profilePage() {
    // TODO: Implement profile page logic
}

function vendorDashboardPage() {
    // Initialize vendor dashboard - fetch and display bookings
    fetchVendorBookings();
}

// Fetch categories from API and render them
function fetchCategories() {
    fetch('/vendors/categories/')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch categories');
            return response.json();
        })
        .then(categories => {
            renderCategories(categories);
        })
        .catch(err => {
            const container = document.getElementById('categories-section');
            if (container) container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        });
}

// Fetch events from API and render them
function fetchEvents() {
    fetch('/events/?mine=1')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch events');
            return response.json();
        })
        .then(data => {
            const events = Array.isArray(data) ? data : data.events;
            renderEvents(events);
        })
        .catch(err => {
            const container = document.getElementById('events-section');
            if (container) container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        });
}

// Fetch guests for a specific event
function fetchEventGuests(eventId) {
    return fetch(`/events/${eventId}/guests/`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch guests');
            return response.json();
        });
}

// Fetch vendors for a specific event
function fetchEventVendors(eventId) {
    return fetch(`/events/${eventId}/vendors/`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch vendors');
            return response.json();
        });
}

// Fetch bookings for the logged-in vendor
function fetchVendorBookings() {
    const loadingDiv = document.getElementById('bookings-loading');
    const errorDiv = document.getElementById('bookings-error');
    const listDiv = document.getElementById('bookings-list');
    
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
        const spinner = loadingDiv.querySelector('.spinner-border');
        if (spinner) {
            const loadingText = document.createElement('div');
            loadingText.className = 'mt-2 loading-text';
            loadingText.textContent = 'Loading your bookings';
            if (!loadingDiv.querySelector('.loading-text')) {
                loadingDiv.appendChild(loadingText);
            }
        }
    }
    if (errorDiv) errorDiv.classList.add('d-none');
    
    fetch('/vendors/dashboard/bookings/')
        .then(response => {
            if (handleAuthError(response)) return;
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return response.json();
        })
        .then(data => {
            if (loadingDiv) loadingDiv.style.display = 'none';
            renderVendorBookings(data.bookings || []);
        })
        .catch(error => {
            console.error('Error fetching vendor bookings:', error);
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (errorDiv) {
                errorDiv.textContent = 'Failed to load bookings: ' + error.message;
                errorDiv.classList.remove('d-none');
            }
        });
}

// Render category cards into #categories-section
function renderCategories(categories) {
    const container = document.getElementById('categories-section');
    if (!container) {
        console.warn("Element with id 'categories-section' not found in the DOM.");
        return;
    }
    if (!Array.isArray(categories) || categories.length === 0) {
        container.innerHTML = '<div class="text-muted">No categories found.</div>';
        return;
    }
    container.innerHTML = categories.map(cat => (
        `<div class="card category-card m-2 d-inline-block" style="width: 12rem; cursor:pointer;" data-category="${cat.id}">
            <div class="card-body text-center">
                <h5 class="card-title">${cat.name}</h5>
                <p class="card-text small text-muted">${cat.description || ''}</p>
            </div>
        </div>`
    )).join('');
    // Add event listener
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.getAttribute('data-category');
            window.location.href = `/vendors/page/?category=${categoryId}`;
        });
    });
}

// Render events into #events-section
function renderEvents(events) {
    const container = document.getElementById('events-section');
    if (!container) {
        console.warn("Element with id 'events-section' not found in the DOM.");
        return;
    }
    if (!Array.isArray(events) || events.length === 0) {
        container.innerHTML = '<div class="text-muted">No events found. <a href="#" onclick="showCreateEventForm()">Create your first event</a></div>';
        return;
    }
    container.innerHTML = events.map(event => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">
                        <i class="bi bi-calendar"></i> ${event.date || 'Date TBD'}<br>
                        <i class="bi bi-geo-alt"></i> ${event.location || 'Location TBD'}<br>
                        <i class="bi bi-people"></i> ${event.guest_count || 0} guests<br>
                        <i class="bi bi-briefcase"></i> ${event.vendor_count || 0} vendors
                    </p>
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewEventGuests(${event.id})">
                            Guests
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="viewEventVendors(${event.id})">
                            Vendors
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render guests list
function renderEventGuests(guests, eventId) {
    const container = document.getElementById('guests-list');
    if (!container) return;
    
    if (!Array.isArray(guests) || guests.length === 0) {
        container.innerHTML = '<div class="text-muted">No guests yet.</div>';
        return;
    }
    
    container.innerHTML = guests.map(guest => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong>${guest.name}</strong><br>
                <small class="text-muted">${guest.email}</small>
            </div>
            <select class="form-select form-select-sm guest-rsvp-select" 
                    data-guest-id="${guest.id}" 
                    data-event-id="${guest.event_id || window.currentEventId}"
                    style="width: auto;">
                <option value="invited" ${guest.rsvp_status === 'invited' ? 'selected' : ''}>Invited</option>
                <option value="attending" ${guest.rsvp_status === 'attending' ? 'selected' : ''}>Attending</option>
                <option value="declined" ${guest.rsvp_status === 'declined' ? 'selected' : ''}>Declined</option>
                <option value="waitlist" ${guest.rsvp_status === 'waitlist' ? 'selected' : ''}>Waitlist</option>
            </select>
        </div>
    `).join('');
}

// Render event vendors list
function renderEventVendors(vendors, eventId) {
    const container = document.getElementById('vendors-list');
    if (!container) return;
    
    if (!Array.isArray(vendors) || vendors.length === 0) {
        container.innerHTML = '<div class="text-muted">No vendors booked yet. <a href="/vendors/" target="_blank">Browse vendors</a> to add services to this event.</div>';
        return;
    }
    
    container.innerHTML = vendors.map(booking => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-1">${booking.vendor?.business_name || 'Vendor'}</h6>
                        <p class="card-text mb-1">
                            <strong>Service:</strong> ${booking.service?.title || 'N/A'}<br>
                            <small class="text-muted">
                                ${booking.service?.price ? `Price: ${booking.service.price}` : ''}
                                ${booking.notes ? ` • Notes: ${booking.notes}` : ''}
                            </small>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mb-2">
                            <span class="badge ${getBookingStatusClass(booking.status)}">
                                ${booking.status || 'pending'}
                            </span>
                        </div>
                        <div class="btn-group-vertical btn-group-sm" role="group">
                            ${booking.status !== 'confirmed' ? `<button class="btn btn-outline-success btn-sm booking-status-btn" data-booking-id="${booking.id}" data-new-status="confirmed" data-refresh="event">Confirm</button>` : ''}
                            ${booking.status !== 'cancelled' ? `<button class="btn btn-outline-danger btn-sm booking-status-btn" data-booking-id="${booking.id}" data-new-status="cancelled" data-refresh="event">Cancel</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper function to get booking status CSS class
function getBookingStatusClass(status) {
    switch(status) {
        case 'confirmed': return 'bg-success';
        case 'cancelled': return 'bg-danger';
        case 'pending':
        default: return 'bg-warning text-dark';
    }
}

function renderVendors(vendors) {
    const section = document.getElementById('vendors-section');
    if (!section) return;
    if (!Array.isArray(vendors) || vendors.length === 0) {
        section.innerHTML = '<div class="text-muted">No vendors found.</div>';
        return;
    }
    section.innerHTML = vendors.map(vendor => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card h-100 vendor-card">
                <img src="${vendor.profile_pic || '/static/js/img/default_vendor.jpg'}" class="card-img-top" alt="${vendor.business_name}">
                <div class="card-body">
                    <h5 class="card-title">${vendor.business_name}</h5>
                    <p class="card-text">${vendor.description || ''}</p>
                    <p class="card-text small text-muted mb-1">
                        <i class="bi bi-geo-alt"></i> ${vendor.location || 'N/A'}<br>
                        <i class="bi bi-star-fill text-warning"></i> ${vendor.average_rating ?? '0'} / 5
                        <span class="ms-2">${vendor.services_count} services</span>
                    </p>
                    <button class="btn btn-primary book-vendor-btn" data-id="${vendor.id}">Book Vendor</button>
                    <div class="booking-status mt-2" data-id="${vendor.id}"></div>
                </div>
            </div>
        </div>
    `).join('');
    // Event listeners for Book Vendor buttons
    section.querySelectorAll('.book-vendor-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const vendorId = btn.getAttribute('data-id');
            openBookingModal(vendorId);
        });
    });
}

// Render vendor bookings list for dashboard
function renderVendorBookings(bookings) {
    const container = document.getElementById('bookings-list');
    if (!container) {
        console.warn("Element with id 'bookings-list' not found in the DOM.");
        return;
    }

    if (bookings.length === 0) {
        container.innerHTML = '<p class="text-muted">No bookings found.</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="border-bottom pb-3 mb-3">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6 class="mb-1">${booking.event?.title || 'Event'}</h6>
                    <p class="mb-1">
                        <strong>Service:</strong> ${booking.service?.title || 'N/A'}<br>
                        <small class="text-muted">
                            ${booking.event?.date ? `Date: ${booking.event.date}` : ''}
                            ${booking.event?.location ? ` • Location: ${booking.event.location}` : ''}
                        </small>
                    </p>
                    ${booking.notes ? `<p class="mb-1"><small><strong>Notes:</strong> ${booking.notes}</small></p>` : ''}
                </div>
                <div class="col-md-4 text-end">
                    <div class="mb-2">
                        <span class="badge ${getBookingStatusClass(booking.status)}">
                            ${booking.status || 'pending'}
                        </span>
                    </div>
                    <div class="btn-group-vertical btn-group-sm" role="group">
                        ${booking.status === 'pending' ? `<button class="btn btn-success btn-sm booking-status-btn" data-booking-id="${booking.id}" data-new-status="confirmed" data-refresh="vendor">Confirm</button>` : ''}
                        ${booking.status === 'confirmed' ? `<button class="btn btn-info btn-sm booking-status-btn" data-booking-id="${booking.id}" data-new-status="completed" data-refresh="vendor">Complete</button>` : ''}
                        ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `<button class="btn btn-danger btn-sm booking-status-btn" data-booking-id="${booking.id}" data-new-status="cancelled" data-refresh="vendor">Cancel</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal and Booking Logic
function openBookingModal(vendorId) {
    currentBookingVendorId = vendorId;
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const eventSelectGroup = document.getElementById('event-select-group');
    const eventCreateGroup = document.getElementById('event-create-group');
    const eventSelect = document.getElementById('booking-event');
    const errorDiv = document.getElementById('booking-modal-error');
    // Reset form
    document.getElementById('booking-form').reset();
    errorDiv.classList.add('d-none');
    eventSelectGroup.style.display = '';
    eventCreateGroup.style.display = '';
    // Fetch vendor services
    const serviceSelect = document.getElementById('booking-service');
    serviceSelect.innerHTML = '<option value="">Loading...</option>';
    fetch(`/vendors/${vendorId}/services/`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            const services = Array.isArray(data.services) ? data.services : [];
            if (services.length > 0) {
                serviceSelect.innerHTML = services.map(s => `<option value="${s.id}">${s.title} (${s.price || ''})</option>`).join('');
            } else {
                serviceSelect.innerHTML = '<option value="">No services found</option>';
            }
        })
        .catch(() => {
            serviceSelect.innerHTML = '<option value="">No services found</option>';
        });
    // Fetch user events
    fetch('/events/?mine=1')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            const events = Array.isArray(data) ? data : data.events;
            if (events && events.length > 0) {
                eventSelect.innerHTML = '<option value="">Select an existing event...</option>' + 
                    events.map(ev => `<option value="${ev.id}">${ev.title} (${ev.date})</option>`).join('');
                eventSelectGroup.style.display = '';
                eventCreateGroup.style.display = '';
                // Add helpful text
                const helpText = eventCreateGroup.querySelector('.help-text') || document.createElement('div');
                if (!helpText.classList.contains('help-text')) {
                    helpText.className = 'help-text text-muted small mt-1';
                    helpText.textContent = 'Or create a new event below:';
                    eventCreateGroup.insertBefore(helpText, eventCreateGroup.firstChild);
                }
            } else {
                eventSelect.innerHTML = '<option value="">No events found</option>';
                eventSelectGroup.style.display = 'none';
                eventCreateGroup.style.display = '';
                // Add helpful text for new users
                const helpText = eventCreateGroup.querySelector('.help-text') || document.createElement('div');
                if (!helpText.classList.contains('help-text')) {
                    helpText.className = 'help-text text-muted small mb-2';
                    helpText.textContent = 'Create a new event for this booking:';
                    eventCreateGroup.insertBefore(helpText, eventCreateGroup.firstChild);
                }
            }
            modal.show();
        })
        .catch(() => {
            eventSelect.innerHTML = '<option value="">Error loading events</option>';
            eventSelectGroup.style.display = 'none';
            eventCreateGroup.style.display = '';
            modal.show();
        });
}

// View event guests - opens modal with guest list and add guest form
function viewEventGuests(eventId) {
    // Store current event ID for guest management
    window.currentEventId = eventId;
    
    // Get modal elements
    const modal = new bootstrap.Modal(document.getElementById('guestModal'));
    const guestsList = document.getElementById('guests-list');
    const guestsLoading = document.getElementById('guests-loading');
    const guestFormError = document.getElementById('guest-form-error');
    
    // Reset modal state
    if (guestFormError) guestFormError.classList.add('d-none');
    document.getElementById('add-guest-form').reset();
    
    // Show loading state
    if (guestsLoading) guestsLoading.style.display = 'block';
    if (guestsList) guestsList.innerHTML = '';
    
    // Open modal
    modal.show();
    
    // Fetch and display guests
    fetchEventGuests(eventId)
        .then(guests => {
            renderEventGuests(guests, eventId);
        })
        .catch(err => {
            console.error('Error fetching guests:', err);
            if (guestsList) {
                guestsList.innerHTML = '<div class="text-danger">Error loading guests. Please try again.</div>';
            }
        })
        .finally(() => {
            if (guestsLoading) guestsLoading.style.display = 'none';
        });
}

// View event vendors - opens modal with vendor bookings list
function viewEventVendors(eventId) {
    // Store current event ID for vendor management
    window.currentEventId = eventId;
    
    // Get modal elements
    const modal = new bootstrap.Modal(document.getElementById('vendorModal'));
    const vendorsList = document.getElementById('vendors-list');
    const vendorsLoading = document.getElementById('vendors-loading');
    
    // Show loading state
    if (vendorsLoading) vendorsLoading.style.display = 'block';
    if (vendorsList) vendorsList.innerHTML = '';
    
    // Open modal
    modal.show();
    
    // Fetch and display vendor bookings
    fetchEventVendors(eventId)
        .then(vendors => {
            renderEventVendors(vendors, eventId);
        })
        .catch(err => {
            console.error('Error fetching vendors:', err);
            if (vendorsList) {
                vendorsList.innerHTML = '<div class="text-danger">Error loading vendors. Please try again.</div>';
            }
        })
        .finally(() => {
            if (vendorsLoading) vendorsLoading.style.display = 'none';
        });
}

// Update booking status
function updateBookingStatus(bookingId, newStatus, refreshCallback = null) {
    if (!validateCSRFToken()) {
        showErrorToast('Security validation failed. Please refresh the page and try again.');
        return Promise.reject(new Error('CSRF validation failed'));
    }
    
    return fetch(`/events/bookings/${bookingId}/`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (handleAuthError(response)) return;
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to update booking status');
            });
        }
        return response.json();
    })
    .then(updatedBooking => {
        // Success - show success toast and refresh
        showSuccessToast(`Booking status updated to ${newStatus}`);
        if (refreshCallback) {
            refreshCallback();
        } else if (window.currentEventId) {
            fetchEventVendors(window.currentEventId)
                .then(vendors => renderEventVendors(vendors, window.currentEventId));
        }
    })
    .catch(error => {
        showErrorToast('Error updating booking status: ' + error.message);
        throw error;
    });
}

// Add guest to event
function addGuestToEvent(eventId, guestData) {
    if (!validateCSRFToken()) {
        throw new Error('Security validation failed. Please refresh the page and try again.');
    }
    
    return fetch(`/events/${eventId}/guests/`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(guestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to add guest');
            });
        }
        return response.json();
    });
}

// ================================
// EVENT LISTENERS AND INITIALIZATION
// ================================

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize image fallback handling
    initImageFallbacks();
    
    // Initialize booking form handler
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const eventSelect = document.getElementById('booking-event');
            const eventName = document.getElementById('booking-event-name');
            const eventDate = document.getElementById('booking-event-date');
            const notesInput = document.getElementById('booking-notes');
            const errorDiv = document.getElementById('booking-modal-error');
            let payload = { vendor_id: currentBookingVendorId, notes: notesInput.value };
            // Always require service_id
            const serviceSelect = document.getElementById('booking-service');
            if (serviceSelect && serviceSelect.value) {
                payload.service_id = serviceSelect.value;
            }
            // Prefer new event fields if filled, else use selected event
            if (eventName && eventDate && eventName.value && eventDate.value) {
                payload.event_name = eventName.value;
                payload.event_date = eventDate.value;
            } else if (eventSelect && eventSelect.value) {
                payload.event_id = eventSelect.value;
            }
            
            // Validate CSRF token before making request
            if (!validateCSRFToken()) {
                errorDiv.textContent = 'Security validation failed. Please refresh the page and try again.';
                errorDiv.classList.remove('d-none');
                return;
            }
            
            fetch('/events/bookings/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (response.status === 403) {
                    return response.json().then(errorData => {
                        // User-friendly permission error messages
                        let friendlyMessage = 'You don\'t have permission to book this vendor.';
                        if (errorData.error && errorData.error.includes('event planner')) {
                            friendlyMessage = 'You can only book vendors for events you created.';
                        } else if (errorData.error && errorData.error.includes('planners can create')) {
                            friendlyMessage = 'Only event planners can create new events. Please contact an administrator.';
                        }
                        errorDiv.textContent = friendlyMessage;
                        errorDiv.classList.remove('d-none');
                        return null;
                    }).catch(jsonErr => {
                        errorDiv.textContent = 'Permission denied. Please make sure you\'re logged in as an event planner.';
                        errorDiv.classList.remove('d-none');
                        return null;
                    });
                }
                
                if (!response.ok) {
                    return response.json().then(err => {
                        // Transform technical errors into user-friendly messages
                        let friendlyMessage = 'Something went wrong. Please try again.';
                        if (err.error) {
                            if (err.error.includes('required')) {
                                friendlyMessage = 'Please fill in all required fields.';
                            } else if (err.error.includes('already exists')) {
                                friendlyMessage = 'You\'ve already booked this vendor for this event.';
                            } else if (err.error.includes('not found')) {
                                friendlyMessage = 'The selected vendor or service is no longer available.';
                            }
                        }
                        throw new Error(friendlyMessage);
                    });
                }
                
                return response.json();
            })
            .then(data => {
                if (!data) return;
                if (data.error) {
                    errorDiv.textContent = data.error;
                    errorDiv.classList.remove('d-none');
                } else {
                    // Success - provide multiple forms of feedback
                    const statusDiv = document.querySelector(`.booking-status[data-id="${currentBookingVendorId}"]`);
                    if (statusDiv) {
                        statusDiv.textContent = `✓ Booking ${data.status || 'pending'}`;
                        statusDiv.classList.remove('text-danger');
                        statusDiv.classList.add('text-success');
                        
                        // Add animation to draw attention
                        statusDiv.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            statusDiv.style.transform = 'scale(1)';
                        }, 200);
                    }
                    
                    // Show success message in modal before closing
                    const successDiv = document.createElement('div');
                    successDiv.className = 'alert alert-success mt-3';
                    successDiv.innerHTML = `
                        <strong>Booking successful!</strong> 
                        Your booking request has been submitted and is ${data.status || 'pending'}.
                        ${data.booking?.id ? ` (Booking #${data.booking.id})` : ''}
                    `;
                    
                    const form = document.getElementById('booking-form');
                    form.appendChild(successDiv);
                    
                    // Close modal after showing success message
                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
                        // Clean up success message when modal closes
                        if (successDiv && successDiv.parentNode) {
                            successDiv.remove();
                        }
                    }, 2000);
                }
            })
            .catch(error => {
                // More specific error message based on error type
                let friendlyMessage = 'Unable to submit booking. Please check your internet connection and try again.';
                if (error.message && error.message !== 'Request failed') {
                    friendlyMessage = error.message;
                }
                errorDiv.textContent = friendlyMessage;
                errorDiv.classList.remove('d-none');
            });
        });
    }

    // Initialize add guest form handler
    const addGuestForm = document.getElementById('add-guest-form');
    if (addGuestForm) {
        addGuestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if we have a current event ID
            if (!window.currentEventId) {
                showFormError('guest-form-error', 'No event selected. Please close and reopen the guest manager.');
                return;
            }
            
            const formData = new FormData(addGuestForm);
            const guestData = {
                name: formData.get('name'),
                email: formData.get('email'),
                rsvp_status: formData.get('rsvp_status') || 'invited'
            };
            
            // Validate required fields
            if (!guestData.name || !guestData.email) {
                showFormError('guest-form-error', 'Name and email are required.');
                return;
            }
            
            // Check for duplicate email in current guest list
            const existingGuests = document.querySelectorAll('#guests-list .list-group-item');
            const existingEmails = Array.from(existingGuests).map(item => {
                const emailElement = item.querySelector('.text-muted');
                return emailElement ? emailElement.textContent.trim() : '';
            });
            
            if (existingEmails.includes(guestData.email)) {
                showFormError('guest-form-error', 'Guest is already in the guest list.');
                return;
            }
            
            // Validate CSRF token
            if (!validateCSRFToken()) {
                showFormError('guest-form-error', 'Security validation failed. Please refresh the page and try again.');
                return;
            }
            
            // Submit guest creation
            addGuestToEvent(window.currentEventId, guestData)
                .then(newGuest => {
                    // Success - refresh guest list and reset form
                    addGuestForm.reset();
                    hideFormError('guest-form-error');
                    
                    // Refresh the guest list
                    fetchEventGuests(window.currentEventId)
                        .then(guests => renderEventGuests(guests, window.currentEventId));
                })
                .catch(error => {
                    showFormError('guest-form-error', error.message);
                });
        });
    }

    // Initialize booking status button handler (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('booking-status-btn')) {
            const button = e.target;
            const bookingId = button.getAttribute('data-booking-id');
            const newStatus = button.getAttribute('data-new-status');
            const refreshType = button.getAttribute('data-refresh');
            
            // Set loading state
            setButtonLoading(button, true);
            
            // Determine refresh callback
            const refreshCallback = refreshType === 'vendor' ? fetchVendorBookings : null;
            
            // Update booking status
            updateBookingStatus(bookingId, newStatus, refreshCallback)
                .finally(() => {
                    setButtonLoading(button, false);
                });
        }
    });

    // Initialize category filter button handler (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('category-filter-btn')) {
            const button = e.target;
            const categoryId = button.getAttribute('data-category');
            
            // Prevent double-clicks while loading
            if (button.classList.contains('loading')) return;
            
            // Add loading state to clicked button
            button.classList.add('loading');
            
            // Update active button state
            document.querySelectorAll('.category-filter-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('btn-outline-primary');
                btn.classList.remove('btn-primary');
                if (btn !== button) btn.classList.remove('loading');
            });
            
            // Set clicked button as active
            button.classList.add('active');
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
            
            // Filter vendors by category
            filterVendorsByCategory(categoryId, button);
        }
    });

    // Initialize guest RSVP status change handler (using event delegation)
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('guest-rsvp-select')) {
            const select = e.target;
            const guestId = select.getAttribute('data-guest-id');
            const eventId = select.getAttribute('data-event-id');
            const newStatus = select.value;
            const originalStatus = select.querySelector('option[selected]')?.value || 'invited';
            
            // Show loading state
            select.disabled = true;
            select.style.opacity = '0.6';
            
            // Validate CSRF token
            if (!validateCSRFToken()) {
                showErrorToast('Security validation failed. Please refresh the page and try again.');
                select.value = originalStatus; // Reset to original
                select.disabled = false;
                select.style.opacity = '1';
                return;
            }
            
            // Update RSVP status via API
            fetch(`/events/${eventId}/guests/${guestId}/`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({ rsvp_status: newStatus })
            })
            .then(response => {
                if (handleAuthError(response)) return;
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Failed to update RSVP status');
                    });
                }
                return response.json();
            })
            .then(updatedGuest => {
                // Success - show success toast and update UI
                showSuccessToast(`RSVP status updated to ${newStatus}`);
                select.querySelectorAll('option').forEach(opt => opt.removeAttribute('selected'));
                select.querySelector(`option[value="${newStatus}"]`).setAttribute('selected', 'selected');
                
                // Brief success indication
                select.style.backgroundColor = '#d4edda';
                setTimeout(() => {
                    select.style.backgroundColor = '';
                }, 1000);
            })
            .catch(error => {
                console.error('Error updating RSVP status:', error);
                // Reset to original value on error
                select.value = originalStatus;
                showErrorToast('Failed to update RSVP status: ' + error.message);
            })
            .finally(() => {
                // Re-enable dropdown
                select.disabled = false;
                select.style.opacity = '1';
            });
        }
    });

    // Initialize the appropriate page based on current page
    const main = document.querySelector('main');
    const page = main?.dataset.page;
    switch (page) {
        case 'index':
            indexPage();
            break;
        case 'vendors':
            vendorsPage();
            break;
        case 'events':
            eventsPage();
            break;
        case 'profile':
            profilePage();
            break;
        case 'vendor-dashboard':
            vendorDashboardPage();
            break;
        default:
            // No-op
    }
});

// ================================
// TODO: Future API functions
// ================================
// Example: function fetchVendors() { ... }