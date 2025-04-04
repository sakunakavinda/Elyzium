document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS
    emailjs.init('6Wk6R2DTBHBjcMnEr');
    
    // DOM Elements
    const generateQRButton = document.getElementById('generateQRButton');
    const refreshBtn = document.getElementById('refreshBtn');
    const nameInput = document.getElementById('nameInput');
    const seatInput = document.getElementById('seatInput');
    const ticketTypeSelect = document.getElementById('ticketType');
    const contactInput = document.getElementById('contactInput');
    const contactInputConf = document.getElementById('contactInputConf');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const placeholder = document.getElementById('placeholder');
    const loader = document.getElementById('loader');
    const subTotalElement = document.getElementById('subtotal');
    let status = 0;

    // Firebase configuration and initialization
    const firebaseConfig = {
        apiKey: "AIzaSyCVilUKEZ6qt3ASm_AwGaatTqGpO-OaXOc",
        authDomain: "elyzium-5e378.firebaseapp.com",
        projectId: "elyzium-5e378",
        storageBucket: "elyzium-5e378.appspot.com",
        messagingSenderId: "123407494252",
        appId: "1:123407494252:web:5e496e80e23229aafebc49"
    };
    
    // Initialize Firebase only if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Ticket prices
    const ticketPrices = {
        picnic_mat: 1000,
        camping_chair: 1500
    };

    // Initialize subtotal calculation
    function updateSubTotal() {
        const seats = parseInt(seatInput.value.trim()) || 0;
        const selectedTicketType = ticketTypeSelect.value;
        const pricePerTicket = ticketPrices[selectedTicketType];
        const subTotal = seats * pricePerTicket;
        subTotalElement.textContent = `LKR ${subTotal} /=`;
    }

    // Event listeners for form changes
    seatInput.addEventListener('input', updateSubTotal);
    ticketTypeSelect.addEventListener('change', updateSubTotal);

    // Show cancellation message
    function showCancellationMessage() {
        const existingMessage = document.querySelector('.payment-message');
        if (existingMessage) existingMessage.remove();
        
        const message = document.createElement('div');
        message.className = 'payment-message';
        message.innerHTML = `
            <div style="background: #fff3cd; color: #856404; padding: 10px; 
                        margin: 0 0 15px 0; border: 1px solid #ffeeba;
                        border-radius: 4px; animation: fadeIn 0.5s ease-in;">
                Payment was cancelled. You can review and resubmit your order.
            </div>
        `;
        document.querySelector('form').prepend(message);
        setTimeout(() => message.remove(), 5000);
    }

    // Initialize page
    function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'cancelled') {
            showCancellationMessage();
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        updateSubTotal();
    }

    // Generate QR Button Click Handler
    generateQRButton.addEventListener('click', async function() {
        if (status === 1) {
            alert("Generation process already initiated");
            return;
        }
    
        status = 1;
    
        // Validate inputs
        const name = nameInput.value.trim();
        const seats = parseInt(seatInput.value.trim());
        const contact = contactInput.value.trim();
        const contactConf = contactInputConf.value.trim();
        const selectedTicketType = ticketTypeSelect.value;
    
        if (!name || isNaN(seats) || seats <= 0 || !contact) {
            alert('Please fill all details correctly');
            status = 0;
            return;
        }

        if (contact !== contactConf) {
            alert('Emails do not match');
            status = 0;  
            return;
        }
    
        if (!validateEmail(contact)) {
            alert('Please enter a valid email address');
            status = 0;
            return;
        }
    
        try {
            generateQRButton.disabled = true;
            generateQRButton.textContent = 'Processing...';
            loader.style.display = 'flex';
    
            const ticketId = generateTicketId();
            const total = seats * ticketPrices[selectedTicketType];
            
            const ticketData = {
                ticketId,
                name,
                seats,
                contact,
                ticketType: selectedTicketType,
                total
            };
            
            // Save to Firestore first (as pending)
            const db = firebase.firestore();
            await db.collection('tickets').doc(ticketId).set({
                ...ticketData,
                paymentStatus: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const stripePriceIds = {
                picnic_mat: 'price_1R9q764ZyAT5oIFLt3qvmW9J',
                camping_chair: 'price_1R9q7V4ZyAT5oIFLjFmPkEJ2'
            };
    
            const stripe = Stripe("pk_test_51R9V5a4ZyAT5oIFL6UvbhT3aG2SdirrGBXvoABYEDXKiAUT3q4Nmoc8hDmEnouLjC2NO7TfUIU5UQefgUXJR3sON00AuMCHTdZ");
            
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{
                    price: stripePriceIds[selectedTicketType],
                    quantity: seats,
                }],
                mode: 'payment',
                successUrl: `${window.location.origin}/success.html?ticketId=${ticketId}`,
                cancelUrl: `${window.location.origin}/buy.html?payment=cancelled`,
                clientReferenceId: ticketId,
            });
    
            if (error) throw error;
    
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing your request: ' + error.message);
            status = 0;
            generateQRButton.disabled = false;
            generateQRButton.textContent = 'Buy';
            loader.style.display = 'none';
        }
    });

    // Refresh Button Click Handler
    refreshBtn.addEventListener('click', function() {
        clearInputs();
    });

    // Helper Functions
    function generateTicketId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
        } else {
            return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function clearInputs() {
        nameInput.value = '';
        seatInput.value = '';
        contactInput.value = '';
        contactInputConf.value = '';
        ticketTypeSelect.value = 'picnic_mat';
        subTotalElement.textContent = 'LKR 0 /=';
        if (placeholder) placeholder.style.display = 'block';
        if (qrCodeImage) {
            qrCodeImage.style.display = 'none';
            qrCodeImage.src = '';
        }
    }

    // Initialize the page
    initializePage();
});