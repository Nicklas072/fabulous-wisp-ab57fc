// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});

// --- State Variables ---
let basket = [];
const PRICE_PER_KG = 16.50; // USD 16.50 per Kg

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
const whatsappLink = document.getElementById('whatsapp-link');

// WhatsApp business config
const WHATSAPP_NUMBER = '59893658477';

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
        const price = parseFloat(card.getAttribute('data-price'));

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
        lucide.createIcons();

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--color-mustard-dark)';
            btn.style.borderColor = 'var(--color-mustard-dark)';
            lucide.createIcons();
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
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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
        
        lucide.createIcons();
    }

    // Update displays
    totalWeightDisplay.textContent = `${totalWeight.toFixed(2)} kg`;
    totalPriceDisplay.textContent = formatCurrency(totalPrice);

    // Rotate Scale Needle (5kg = 300deg rotation, capped at 5.2kg so it doesn't spin infinitely)
    const cappedWeight = Math.min(totalWeight, 5.2);
    const rotationAngle = (cappedWeight / 5) * 300;
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

    // Build WhatsApp message with order details
    let messageLines = ['¡Hola BasKula! 🌿', 'Quiero hacer este pedido:', ''];
    basket.forEach(item => {
        const itemTotalWeight = item.weight * item.qty;
        const itemTotalPrice = item.price * item.qty;
        messageLines.push(`• ${item.name} (x${item.qty}) - ${itemTotalWeight.toFixed(2)} kg - ${formatCurrency(itemTotalPrice)}`);
    });
    messageLines.push('');
    messageLines.push(`*Peso total:* ${totalWeight.toFixed(2)} kg`);
    messageLines.push(`*Total estimado:* ${formatCurrency(totalPrice)}`);

    const whatsappMessage = encodeURIComponent(messageLines.join('\n'));
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

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

// --- Postcard Form Logic (Netlify Forms via AJAX) ---
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const btnSubmit = contactForm.querySelector('.btn-postcard');
    const originalContent = btnSubmit.innerHTML;

    // Sending state
    btnSubmit.innerHTML = `<i data-lucide="loader"></i> Enviando...`;
    btnSubmit.disabled = true;
    lucide.createIcons();

    // Serialize form data (encodes "form-name" + honeypot + fields)
    const formData = new FormData(contactForm);

    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        btnSubmit.innerHTML = `<i data-lucide="check"></i> ¡Enviado!`;
        btnSubmit.style.backgroundColor = 'var(--color-olive)';
        btnSubmit.style.boxShadow = 'none';
        lucide.createIcons();

        alert(`¡Gracias por tu mensaje! Tu postal fue enviada con éxito. Nos pondremos en contacto muy pronto.`);

        setTimeout(() => {
            contactForm.reset();
            btnSubmit.innerHTML = originalContent;
            btnSubmit.style.backgroundColor = 'var(--color-mustard)';
            btnSubmit.style.boxShadow = '0 4px 15px rgba(226, 167, 39, 0.3)';
            btnSubmit.disabled = false;
            lucide.createIcons();
        }, 2000);
    })
    .catch((error) => {
        btnSubmit.innerHTML = originalContent;
        btnSubmit.disabled = false;
        lucide.createIcons();
        alert('Hubo un problema al enviar el mensaje. Por favor, intentá de nuevo o escribinos a info@baskula.com');
        console.error('Form submit error:', error);
    });
});
