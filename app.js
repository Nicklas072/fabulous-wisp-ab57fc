// Initialize Lucide Icons
const refreshIcons = () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
});

// --- State Variables ---
let basket = [];
const PRICE_PER_KG = 950; // $U 950 UYU per Kg

// --- DOM Elements ---
const scaleNeedle = document.getElementById('scale-needle');
const basketItemsList = document.getElementById('basket-items-list');
const totalWeightDisplay = document.getElementById('total-weight-display');
const totalPriceDisplay = document.getElementById('total-price-display');
const btnReset = document.getElementById('btn-reset');
const btnCheckout = document.getElementById('btn-checkout');

// Modal Elements
const checkoutModal = document.getElementById('checkout-modal');
const modalClose = document.getElementById('modal-close');
const modalDoneBtn = document.getElementById('modal-done-btn');
const modalWeight = document.getElementById('modal-weight');
const modalPrice = document.getElementById('modal-price');
const modalItemsList = document.getElementById('modal-items-list');

// Mobile Menu Elements
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const mobileCloseBtn = document.querySelector('.mobile-close-btn');
const mobileLinks = document.querySelectorAll('.mobile-link');

// --- Mobile Navigation Logic ---
mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.add('open');
});

const closeMobileMenu = () => {
    mobileNav.classList.remove('open');
};

mobileCloseBtn.addEventListener('click', closeMobileMenu);
mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// --- Scale & Basket Simulation Logic ---

// Add item to basket
const addButtons = document.querySelectorAll('.btn-add-item');
addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.ceramic-item-card');
        const name = card.getAttribute('data-name');
        const weight = parseFloat(card.getAttribute('data-weight'));
        const price = parseInt(card.getAttribute('data-price'));

        // Check if item already in basket
        const existingItem = basket.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            basket.push({ name, weight, price, qty: 1 });
        }

        // Trigger button feedback animation
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check"></i> ¡Pesado!`;
        btn.style.backgroundColor = 'var(--color-olive)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--color-olive)';
        refreshIcons();

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--color-mustard-dark)';
            btn.style.borderColor = 'var(--color-mustard-dark)';
            refreshIcons();
        }, 1000);

        updateScale();
    });
});

// Remove item from basket
const removeItem = (itemName) => {
    const itemIndex = basket.findIndex(item => item.name === itemName);
    if (itemIndex > -1) {
        if (basket[itemIndex].qty > 1) {
            basket[itemIndex].qty -= 1;
        } else {
            basket.splice(itemIndex, 1);
        }
    }
    updateScale();
};

// Reset scale
const resetScale = () => {
    basket = [];
    updateScale();
};

btnReset.addEventListener('click', resetScale);

// Format currency helper
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
};

// Calculate and render updates
const updateScale = () => {
    let totalWeight = 0;
    let totalPrice = 0;

    // Clear list
    basketItemsList.innerHTML = '';

    if (basket.length === 0) {
        basketItemsList.innerHTML = '<li class="empty-basket-message">La balanza está vacía. Elegí cerámicas del estante para pesarlas.</li>';
        btnCheckout.disabled = true;
    } else {
        btnCheckout.disabled = false;
        
        basket.forEach(item => {
            const itemTotalWeight = item.weight * item.qty;
            const itemTotalPrice = item.price * item.qty;
            totalWeight += itemTotalWeight;
            totalPrice += itemTotalPrice;

            const li = document.createElement('li');
            li.className = 'basket-item';
            li.innerHTML = `
                <div class="basket-item-info">
                    <span class="basket-item-name">${item.name} (${item.qty}u)</span>
                    <span class="basket-item-weight">${itemTotalWeight.toFixed(2)} kg</span>
                </div>
                <div class="basket-item-actions">
                    <span>${formatCurrency(itemTotalPrice)}</span>
                    <button class="btn-remove-item" data-name="${item.name}" aria-label="Eliminar item">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            basketItemsList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-remove-item').forEach(removeBtn => {
            removeBtn.addEventListener('click', (e) => {
                const name = removeBtn.getAttribute('data-name');
                removeItem(name);
            });
        });
        
        refreshIcons();
    }

    // Update displays
    totalWeightDisplay.textContent = `${totalWeight.toFixed(2)} kg`;
    totalPriceDisplay.textContent = formatCurrency(totalPrice);

    // Rotate Scale Needle (5kg = 300deg rotation, leaving a 60deg gap at the top)
    const rotationAngle = (totalWeight / 5) * 300;
    scaleNeedle.style.transform = `rotate(${rotationAngle}deg)`;
};

// --- Checkout Modal Logic ---
btnCheckout.addEventListener('click', () => {
    let totalWeight = 0;
    let totalPrice = 0;

    modalItemsList.innerHTML = '';

    basket.forEach(item => {
        const itemTotalWeight = item.weight * item.qty;
        const itemTotalPrice = item.price * item.qty;
        totalWeight += itemTotalWeight;
        totalPrice += itemTotalPrice;

        const row = document.createElement('div');
        row.className = 'modal-item-row';
        row.innerHTML = `
            <span>${item.name} (x${item.qty})</span>
            <span>${formatCurrency(itemTotalPrice)}</span>
        `;
        modalItemsList.appendChild(row);
    });

    modalWeight.textContent = `${totalWeight.toFixed(2)} kg`;
    modalPrice.textContent = formatCurrency(totalPrice);

    // Open Modal
    checkoutModal.classList.add('open');
});

const closeModal = () => {
    checkoutModal.classList.remove('open');
    resetScale(); // empty scale after checkout completion
};

modalClose.addEventListener('click', closeModal);
modalDoneBtn.addEventListener('click', closeModal);
checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
        closeModal();
    }
});

// --- Postcard Form Logic ---
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Animate Submit Button
    const btnSubmit = contactForm.querySelector('.btn-postcard');
    const originalContent = btnSubmit.innerHTML;
    
    btnSubmit.innerHTML = `<i data-lucide="check"></i> ¡Enviado!`;
    btnSubmit.style.backgroundColor = 'var(--color-olive)';
    btnSubmit.style.boxShadow = 'none';
    refreshIcons();
    
    alert(`¡Gracias por tu mensaje! Tu postal fue enviada con éxito. Nos pondremos en contacto muy pronto.`);
    
    setTimeout(() => {
        contactForm.reset();
        btnSubmit.innerHTML = originalContent;
        btnSubmit.style.backgroundColor = 'var(--color-mustard)';
        btnSubmit.style.boxShadow = '0 4px 15px rgba(226, 167, 39, 0.3)';
        refreshIcons();
    }, 2000);
});
