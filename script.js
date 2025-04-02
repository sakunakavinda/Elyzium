document.addEventListener('DOMContentLoaded', function () {
    emailjs.init('6Wk6R2DTBHBjcMnEr');
    const generateQRButton = document.getElementById('generateQRButton');
    const refreshBtn = document.getElementById('refreshBtn');
    const nameInput = document.getElementById('nameInput');
    const seatInput = document.getElementById('seatInput');
    const ticketTypeSelect = document.getElementById('ticketType');
    const contactInput = document.getElementById('contactInput');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const placeholder = document.getElementById('placeholder');
    const loader = document.getElementById('loader');
    const subTotalElement = document.getElementById('subtotal');
    
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

    // Set up event listeners for changes
    seatInput.addEventListener('input', updateSubTotal);
    ticketTypeSelect.addEventListener('change', updateSubTotal);

    // Initialize subtotal on page load
    updateSubTotal();

    generateQRButton.addEventListener('click', async function () {
        // Helper function to check connectivity
        async function checkConnection() {
            if (!navigator.onLine) return false;
            try {
                // More reliable check than just navigator.onLine
                const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
                return true;
            } catch {
                return false;
            }
        }
    
        // Initial connection check
        if (!(await checkConnection())) {
            alert("No internet connection. Please check your network and try again.");
            return;
        }
    
        const name = nameInput.value.trim();
        const seats = parseInt(seatInput.value.trim());
        const contact = contactInput.value.trim();
        const selectedTicketType = ticketTypeSelect.value;
    
        if (!name || isNaN(seats) || !contact) {
            alert('Please fill all details correctly');
            return;
        }
    
        if (!validateEmail(contact)) {
            alert('Please enter a valid email address');
            return;
        }
    
        // Disable button and show processing state
        generateQRButton.disabled = true;
        generateQRButton.textContent = 'Processing...';
        loader.style.display = 'flex';
    
        try {
            // Check connection before starting process
            if (!(await checkConnection())) {
                throw new Error("No internet connection");
            }
    
            const ticketId = generateTicketId();
            const pricePerTicket = ticketPrices[selectedTicketType];
            const total = seats * pricePerTicket;
            const ticketData = `${ticketId},${name},${seats},${contact},${selectedTicketType},${total}`;
            const encryptedData = encrypt(ticketData);
            const qrCodeImageUrl = generateQRCode(encryptedData);
            
            // Check connection before Firestore
            if (!(await checkConnection())) {
                throw new Error("Connection lost before saving to database");
            }
            
            await saveToFirestore(ticketId, {
                contact: contact,
                name: name,
                seatCount: seats,
                ticketId: ticketId,
                totalPrice: total,
                ticketType: selectedTicketType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Check connection before email
            if (!(await checkConnection())) {
                throw new Error("Connection lost before sending email");
            }
            
            await sendEmail(contact, ticketId, name, seats, total, selectedTicketType, qrCodeImageUrl);
            
            clearInputs();
            alert('Ticket purchased successfully! Email sent with QR code.');
            
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes("internet") || error.message.includes("Connection")) {
                alert("Network error: Please check your internet connection and try again.");
            } else {
                alert('Error processing your request: ' + error.message);
            }
        } finally {
            generateQRButton.disabled = false;
            generateQRButton.textContent = 'Buy';
            loader.style.display = 'none';
        }
    });

    refreshBtn.addEventListener('click', function () {
        clearInputs();
    });

    function generateTicketId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
        } else {
            return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
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

    function encrypt(ticketData) {
        const AES_KEY = 'Wagasenevi123456';
        const key = CryptoJS.enc.Utf8.parse(AES_KEY);
        const plaintext = CryptoJS.enc.Utf8.parse(ticketData);

        const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        });

        return encrypted.toString().replace(/\n/g, '');
    }

    function generateQRCode(data) {
        const qr = qrcode(0, 'H');
        qr.addData(data);
        qr.make();
    
        const size = 250;
        const margin = 20;
        const totalSize = size + margin * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = totalSize;
        canvas.height = totalSize;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalSize, totalSize);
        
        const moduleCount = qr.getModuleCount();
        const moduleSize = size / moduleCount;
        
        for (let x = 0; x < moduleCount; x++) {
            for (let y = 0; y < moduleCount; y++) {
                const isDark = qr.isDark(x, y);
                ctx.fillStyle = isDark ? '#000000' : '#FFFFFF';
                ctx.fillRect(
                    margin + x * moduleSize,
                    margin + y * moduleSize,
                    moduleSize,
                    moduleSize
                );
            }
        }
    
        const imageUrl = canvas.toDataURL('image/png', 1.0);
        
        placeholder.style.display = 'none';
        qrCodeImage.src = imageUrl;
        qrCodeImage.style.display = 'block';
        
        return imageUrl;
    }
    
    async function sendEmail(recipientEmail, ticketId, name, seats, total, ticketType, qrCodeBase64) {
        try {
            const formData = new FormData();
            const base64Data = qrCodeBase64.split(',')[1];
            formData.append('image', base64Data);
            
            const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=fd2ccc747be81c79cc64af5ee7c73d72', {
                method: 'POST',
                body: formData
            });
    
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload QR code');
            }
    
            const uploadData = await uploadResponse.json();
            const qrCodeUrl = uploadData.data.url;
    
            await emailjs.send('service_mqh69bb', 'template_gak2o99', {
                recipientEmail: recipientEmail,
                us: 'Elyzium Events',
                name: name,
                email: 'elyziumevents@gmail.com',
                ticket_id: ticketId,
                seats: seats,
                ticket_type: ticketType === 'picnic_mat' ? 'Picnic Mat Seating' : 'Camping Chair Seating',
                total: total,
                qr_code: qrCodeUrl
            });
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function clearInputs() {
        nameInput.value = '';
        seatInput.value = '';
        contactInput.value = '';
        ticketTypeSelect.value = 'picnic_mat';
        subTotalElement.textContent = 'LKR 0 /=';
        placeholder.style.display = 'block';
        qrCodeImage.style.display = 'none';
        qrCodeImage.src = '';
    }

    // Firebase configuration and initialization
    const firebaseConfig = {
        apiKey: "AIzaSyCVilUKEZ6qt3ASm_AwGaatTqGpO-OaXOc",
        authDomain: "elyzium-5e378.firebaseapp.com",
        projectId: "elyzium-5e378",
        storageBucket: "elyzium-5e378.appspot.com",
        messagingSenderId: "123407494252",
        appId: "1:123407494252:web:5e496e80e23229aafebc49"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Function to save ticket data to Firestore
    async function saveToFirestore(ticketId, ticketData) {
        try {
            const db = firebase.firestore();
            await db.collection('tickets').doc(ticketId).set(ticketData);
            console.log('Ticket saved to Firestore with ID:', ticketId);
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            throw error;
        }
    }
});