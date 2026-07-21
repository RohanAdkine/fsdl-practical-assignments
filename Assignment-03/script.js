// Configuration and State
const state = {
    cartCount: 0,
    currentFilter: 'all'
};

// Indian Currency Formatter
const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
});

// Mock Product Data
// The prices are set realistically to INR market conditions for these brands.
const products = [
    {
        id: 1,
        name: "Apple Watch Series 9",
        brand: "Apple",
        price: 41900,
        oldPrice: 44900,
        rating: 4.9,
        reviews: 1245,
        image: "assets/9.jpg",
        badge: "New"
    },
    {
        id: 2,
        name: "boAt Lunar Connect",
        brand: "boAt",
        price: 2499,
        oldPrice: 5999,
        rating: 4.4,
        reviews: 3210,
        image: "assets/Boat Lunar.jpg",
        badge: "-58%"
    },
    {
        id: 3,
        name: "Noise ColorFit Pro 4",
        brand: "Noise",
        price: 3499,
        oldPrice: 5999,
        rating: 4.5,
        reviews: 840,
        image: "assets/Noise Colourfit.jpg",
        badge: "Bestseller"
    },
    {
        id: 4,
        name: "Noise Pulse",
        brand: "Noise",
        price: 2499,
        oldPrice: 5999,
        rating: 4.2,
        reviews: 870,
        image: "assets/Noise Plus 4.jpg",
        badge: "Bestseller"
    },
    {
        id: 5,
        name: "Fire-Boltt Oracle",
        brand: "Fire-Boltt",
        price: 4499,
        oldPrice: 11999,
        rating: 4.6,
        reviews: 2100,
        image: "assets/fireboltt oracle.jpg",
        badge: "AMOLED"
    },
    {
        id: 6,
        name: "Apple Watch SE (Gen 2)",
        brand: "Apple",
        price: 29900,
        oldPrice: null,
        rating: 4.8,
        reviews: 310,
        image: "assets/9.jpg",
        badge: null
    },
    {
        id: 7,
        name: "Noise Colourfit pro",
        brand: "Noise",
        price: 3999,
        oldPrice: 7999,
        rating: 4.3,
        reviews: 950,
        image: "assets/Noise Colourfit pro.jpg",
        badge: "Metallic"
    },
    {
        id: 8,
        name: "boAt Wave 3",
        brand: "boAt",
        price: 2299,
        oldPrice: 7990,
        rating: 4.2,
        reviews: 5040,
        image: "assets/Boat wave 3.jpg",
        badge: "Sale"
    },
    {
        id: 9,
        name: "Fire-Boltt Phoenix",
        brand: "Fire-Boltt",
        price: 2499,
        oldPrice: 9999,
        rating: 4.4,
        reviews: 1620,
        image: "assets/fireboalt phoenix.jpg",
        badge: "Big Display"
    },
    {
        id: 10,
        name: "Fire-Boltt Ninja",
        brand: "Fire-Boltt",
        price: 1299,
        oldPrice: 7999,
        rating: 4.3,
        reviews: 120,
        image: "assets/firebolt ninja.jpg",
        badge: "Big Display"
    },
    {
        id: 11,
        name: "Fire-Boltt Blizaard",
        brand: "Fire-Boltt",
        price: 12499,
        oldPrice: 22999,
        rating: 4.9,
        reviews: 11,
        image: "assets/Fireboltt Blizaard.jpg",
        badge: "Big Display"
    }

];

// DOM Elements
const navbar = document.getElementById('navbar');
const productGrid = document.getElementById('product-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartBadge = document.querySelector('.cart-badge');
const toastContainer = document.getElementById('toast-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.add('scrolled'); // Force glassmorphism even at top for consistent look, or remove this else condition block to make it transparent at top. Let's make it transparent at top:
        navbar.classList.remove('scrolled');
    }

    // Safety check just to enforce if we wanted glass always
    if (window.scrollY > 10) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// Initialization
function initApp() {
    renderProducts(products);
    setupFilters();
}

// Generate Product HTML
function renderProducts(productsToRender) {
    productGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-muted); padding: 2rem;">No products found for this category.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const hasOldPrice = product.oldPrice && product.oldPrice > product.price;
        const formattedPrice = currencyFormatter.format(product.price);
        const formattedOldPrice = hasOldPrice ? currencyFormatter.format(product.oldPrice) : '';

        const cardNode = document.createElement('div');
        cardNode.className = 'product-card';
        cardNode.style.animation = `fadeUp 0.5s ease backwards`; // Optional animation 

        cardNode.innerHTML = `
            ${product.badge ? '<div class="card-badge">' + product.badge + '</div>' : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <span class="product-brand">${product.brand}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    <i class="ph-fill ph-star"></i>
                    <span>${product.rating} (${product.reviews})</span>
                </div>
                <div class="product-footer">
                    <div class="price-container">
                        <span class="product-price">${formattedPrice}</span>
                        ${hasOldPrice ? '<span class="old-price">' + formattedOldPrice + '</span>' : ''}
                    </div>
                    <button class="add-to-cart" onclick="addToCart('${product.name}')" aria-label="Add to cart">
                        <i class="ph ph-shopping-cart-simple"></i>
                    </button>
                </div>
            </div>
        `;

        productGrid.appendChild(cardNode);
    });
}

// Filter Logic
function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            e.target.classList.add('active');

            const filterValue = e.target.getAttribute('data-filter');

            if (filterValue === 'all') {
                renderProducts(products);
            } else {
                const filteredProducts = products.filter(p => p.brand === filterValue);
                renderProducts(filteredProducts);
            }
        });
    });
}

// Add to Cart Logic
window.addToCart = function (productName) {
    state.cartCount++;
    cartBadge.textContent = state.cartCount;

    // Add animation to badge
    cartBadge.style.transform = 'scale(1.5)';
    setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
    }, 200);

    showToast(`Added <strong>${productName}</strong> to cart!`);
};

// Toast Notification System
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="ph-fill ph-check-circle toast-icon"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}
