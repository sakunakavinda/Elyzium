document.addEventListener('DOMContentLoaded', function () {
    emailjs.init('6Wk6R2DTBHBjcMnEr');
    const generateQRButton = document.getElementById('generateQRButton');
    const refreshBtn = document.getElementById('refreshBtn');
    const nameInput = document.getElementById('nameInput');
    const seatInput = document.getElementById('seatInput');
    const contactInput = document.getElementById('contactInput');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const placeholder = document.getElementById('placeholder');
    const loader = document.getElementById('loader');
    const ticketPrice = 2000;

    generateQRButton.addEventListener('click', async function () {  // Make this async
        const name = nameInput.value.trim();
        const seats = parseInt(seatInput.value.trim());
        const contact = contactInput.value.trim();

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
            const ticketId = generateTicketId();
            const ticketData = `${ticketId},${name},${seats},${contact}`;
            const encryptedData = encrypt(ticketData);
            const qrCodeImageUrl = generateQRCode(encryptedData);
            const total = seats * ticketPrice;
            
            // Await the email sending process
            await sendEmail(contact, ticketId, name, seats, total, qrCodeImageUrl);
            
            alert('Email sent successfully with QR code!');
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing your request: ' + error.message);
        } finally {
            // Reset button state and hide loader
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
        // Create QR code with higher error correction
        const qr = qrcode(0, 'H'); // 'H' for High error correction
        qr.addData(data);
        qr.make();
    
        // Increase size and add margin
        const size = 250;
        const margin = 20;
        const totalSize = size + margin * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = totalSize;
        canvas.height = totalSize;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalSize, totalSize);
        
        // Calculate module size
        const moduleCount = qr.getModuleCount();
        const moduleSize = size / moduleCount;
        
        // Draw QR code with margin
        for (let x = 0; x < moduleCount; x++) {
            for (let y = 0; y < moduleCount; y++) {
                const isDark = qr.isDark(x, y);
                ctx.fillStyle = isDark ? '#000000' : '#FFFFFF'; // Higher contrast
                ctx.fillRect(
                    margin + x * moduleSize,
                    margin + y * moduleSize,
                    moduleSize,
                    moduleSize
                );
            }
        }
    
        // Create image data URL
        const imageUrl = canvas.toDataURL('image/png', 1.0); // Highest quality
        
        // Display the QR code
        placeholder.style.display = 'none';
        qrCodeImage.src = imageUrl;
        qrCodeImage.style.display = 'block';
        
        return imageUrl;
    }
    
    async function sendEmail(recipientEmail, ticketId, name, seats, total, qrCodeBase64) {
        try {
            // 1. Upload QR code to ImgBB
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
    
            // 2. Send email with the hosted image URL
            await emailjs.send('service_mqh69bb', 'template_gak2o99', {
                recipientEmail: recipientEmail,
                us: 'Elyzium Events',
                name: name,
                email: 'elyziumevents@gmail.com',
                ticket_id: ticketId,
                seats: seats,
                total: total,
                qr_code: qrCodeUrl
            });
        } catch (error) {
            console.error('Error:', error);
            throw error; // Re-throw to be caught by the outer try-catch
        }
    }

    function clearInputs() {
        nameInput.value = '';
        seatInput.value = '';
        contactInput.value = '';
        placeholder.style.display = 'block';
        qrCodeImage.style.display = 'none';
        qrCodeImage.src = '';
    }
});