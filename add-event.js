import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD23cBMvewgTByUcdTNDKe2t4VXtNGEk3A",
  authDomain: "elyzium-5e378.firebaseapp.com",
  projectId: "elyzium-5e378",
  storageBucket: "elyzium-5e378.appspot.com",
  messagingSenderId: "123407494252",
  appId: "1:123407494252:web:324e83b36e587aa1febc49",
  measurementId: "G-53JP89GP8T"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ImgBB API key
const imgbbAPIKey = "fd2ccc747be81c79cc64af5ee7c73d72";

const saveEventBtn = document.getElementById("saveEventBtn");
const msg = document.getElementById("msg");
const ticketTypesContainer = document.getElementById("ticketTypes");
const addTicketTypeBtn = document.getElementById("addTicketTypeBtn");

// Progress bar
let progressBar = document.createElement("progress");
progressBar.value = 0;
progressBar.max = 100;
progressBar.style.display = "none";
progressBar.style.marginTop = "10px";
saveEventBtn.parentNode.appendChild(progressBar);

// Add new ticket type dynamically
addTicketTypeBtn.addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("ticket-type");

  div.innerHTML = `
    <label>Category Name</label>
    <input type="text" class="ticket-name" placeholder="e.g. VIP">

    <label>Price</label>
    <input type="number" class="ticket-price" placeholder="Enter price">

    <label>Quantity</label>
    <input type="number" class="ticket-qty" placeholder="Enter quantity">
  `;

  ticketTypesContainer.appendChild(div);
});

// Save event
saveEventBtn.addEventListener("click", async () => {
  const name = document.getElementById("eventName").value.trim();
  const date = document.getElementById("eventDate").value;
  const time = document.getElementById("eventTime").value;
  const venue = document.getElementById("venue").value.trim();
  const organizer = document.getElementById("organizer").value.trim();
  const flyerFile = document.getElementById("flyer").files[0];
  const contact = document.getElementById("contact").value;

  // Collect ticket types dynamically
  const ticketTypes = [];
  document.querySelectorAll(".ticket-type").forEach((el) => {
    const typeName = el.querySelector(".ticket-name").value.trim();
    const typePrice = el.querySelector(".ticket-price").value;
    const typeQty = el.querySelector(".ticket-qty").value;

    if (typeName && typePrice && typeQty) {
      ticketTypes.push({
        name: typeName,
        price: Number(typePrice),
        quantity: Number(typeQty)
      });
    }
  });

  // Basic validation
  if (!name || !date || !time || !venue || !organizer || !flyerFile || ticketTypes.length === 0) {
    msg.textContent = "⚠️ Please fill all required fields (at least 1 ticket type)!";
    msg.style.color = "red";
    return;
  }

  try {
    saveEventBtn.disabled = true;
    saveEventBtn.textContent = "Saving...";
    msg.textContent = "";
    progressBar.style.display = "block";
    progressBar.value = 20;

    // Upload flyer to ImgBB
    const formData = new FormData();
    formData.append("image", flyerFile);

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbAPIKey}`, {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error("Image upload failed!");

    const flyerUrl = uploadData.data.url;
    progressBar.value = 60;

    // Save event in Firestore
    await addDoc(collection(db, "events"), {
      title: name,
      date: date,
      time: time,
      venue: venue,
      organizer: organizer,
      ticketTypes: ticketTypes, // dynamic array
      flyerUrl: flyerUrl,
      contact: `https://wa.me/${contact}`,
      createdAt: serverTimestamp()
    });

    progressBar.value = 100;
    alert("✅ Event saved successfully!");
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    msg.textContent = "❌ Error: " + error.message;
    msg.style.color = "red";
  } finally {
    saveEventBtn.disabled = false;
    saveEventBtn.textContent = "Save Event";
    progressBar.style.display = "none";
  }
});