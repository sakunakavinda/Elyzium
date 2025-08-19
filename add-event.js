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
const imgbbAPIKey = "b39809d92fb65ba3d028be78ec1db78c";

const saveEventBtn = document.getElementById("saveEventBtn");
const msg = document.getElementById("msg");

// Create progress bar dynamically
let progressBar = document.createElement("progress");
progressBar.value = 0;
progressBar.max = 100;
progressBar.style.display = "none";
progressBar.style.marginTop = "10px";
saveEventBtn.parentNode.appendChild(progressBar);

saveEventBtn.addEventListener("click", async () => {
  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;
  const venue = document.getElementById("venue").value;

  const type1 = document.getElementById("type1").value;
  const type2 = document.getElementById("type2").value;
  const type3 = document.getElementById("type3").value;

  const qty1 = document.getElementById("qty1").value;
  const qty2 = document.getElementById("qty2").value;
  const qty3 = document.getElementById("qty3").value;

  const flyerFile = document.getElementById("flyer").files[0];

  if (!name || !date || !venue || !type1 || !qty1 || !flyerFile) {
    msg.textContent = "Please fill all required fields!";
    return;
  }

  try {
    saveEventBtn.disabled = true;
    saveEventBtn.textContent = "Saving...";
    progressBar.style.display = "block";
    progressBar.value = 20;

    // Upload flyer
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

    // Save event with ticket types and quantities
    await addDoc(collection(db, "events"), {
      title: name,
      date: date,
      venue: venue,
      ticketTypes: {
        type1: { price: Number(type1), quantity: Number(qty1) },
        type2: { price: Number(type2), quantity: Number(qty2) || 0 },
        type3: { price: Number(type3), quantity: Number(qty3) || 0 }
      },
      flyerUrl: flyerUrl,
      createdAt: serverTimestamp()
    });

    progressBar.value = 100;
    alert("Event saved successfully!");
    window.location.href = "admin-dashboard.html";
  } catch (error) {
    msg.textContent = "Error: " + error.message;
  } finally {
    saveEventBtn.disabled = false;
    saveEventBtn.textContent = "Save Event";
    progressBar.style.display = "none";
  }
});