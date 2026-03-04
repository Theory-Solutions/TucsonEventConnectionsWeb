// --- CONFIGURATION & SECURITY ---
const SB_URL = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/dispatch-call';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc3JzbXhqcnBuanRmd3ZoamluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTAzMDEsImV4cCI6MjA4ODA2NjMwMX0.cSTaLQXlQzMAP65xJGT24qz1p3cCr0WyA3oVL8Q3HMg';
const THEORY_AUTH = 'Tucson-Lead-2026'; // Handshake for the secure dispatch-call

let chatData = { 
    vendors: [], 
    name: '', 
    phone: '', 
    email: '', 
    eventDate: '', 
    guests: '',
    marketingConsent: false
};

// --- STARTUP LOGIC ---

window.onload = () => {
    setTimeout(() => {
        const widget = document.getElementById('chat-widget');
        if (widget) { 
            widget.style.display = 'flex'; 
            startChat(); 
        }
    }, 6000); // 6-second delay as requested
};

// --- SECURE DISPATCH HANDSHAKE ---

async function pushToSupabase(payload) {
    if (!payload.email || payload.email.length < 5) {
        console.warn("🚫 Blocked empty submission attempt.");
        return;
    }

    try {
        const response = await fetch(SB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`,
                'X-Theory-Auth': THEORY_AUTH // Bot-Proof Gatekeeper
            },
            body: JSON.stringify(payload)
        });
        
        if (response.status === 429) {
            alert("Rate limit reached. Please wait 60 seconds before submitting again.");
        } else if (response.ok) {
            console.log("Lead successfully routed to Tucson partners.");
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
    }
}

// --- DRAWER INTERFACE LOGIC ---

window.openDrawer = (title, desc, mediaUrl) => {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    
    if (!drawer || !overlay) return;

    document.getElementById('drawer-title').innerText = title;
    document.getElementById('drawer-desc').innerText = desc;
    document.getElementById('drawer-media-box').style.backgroundImage = `url('${mediaUrl}')`;
    
    drawer.classList.add('is-active');
    overlay.classList.add('is-active');
    
    document.getElementById('drawer-action-btn').onclick = () => {
        closeDrawer();
        jumpToCategory(title); // Bridges drawer to chat flow
    };
};

window.closeDrawer = () => {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    if (drawer) drawer.classList.remove('is-active');
    if (overlay) overlay.classList.remove('is-active');
};

// --- CHAT UI UTILITIES ---

async function renderMessage(text, side = 'bot') {
    const chatDisplay = document.getElementById('chat-display');
    const msgDiv = document.createElement('div');
    msgDiv.className = side === 'bot' ? 'chat-msg bot-msg' : 'chat-msg user-msg';
    if (side === 'bot') {
        msgDiv.innerText = "...";
        chatDisplay.appendChild(msgDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        await new Promise(res => setTimeout(res, 800));
        msgDiv.innerText = text;
    } else {
        msgDiv.innerText = text;
        chatDisplay.appendChild(msgDiv);
    }
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function clearInputs() { 
    const controls = document.getElementById('chat-controls');
    if (controls) controls.innerHTML = ''; 
}

// --- CORE CHAT FLOW ---

async function startChat() {
    clearInputs();
    await renderMessage("Hey, I'm the Theory Assistant! 👋");
    await renderMessage("Ready to find some vendors for your Tucson event?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link btn-oversized" onclick="handleInitial(true)">YES</button>
        <button class="button is-light btn-oversized" onclick="handleInitial(false)">NO</button>`;
}

window.handleInitial = async (isYes) => {
    clearInputs();
    if (!isYes) {
        renderMessage("No", "user");
        await renderMessage("No problem! Come back when you're ready to plan.");
        return;
    }
    renderMessage("Yes", "user");
    await renderMessage("Great! What is the event date?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="date" id="eventDate">
        <button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>`;
};

window.saveDate = async (jumpCat = null) => {
    const val = document.getElementById('eventDate').value;
    if (!val) return;
    chatData.eventDate = val;
    renderMessage(val, "user"); clearInputs();
    await renderMessage("Roughly how many guests are you expecting?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="number" id="guestCount" placeholder="e.g. 50">
        <button class="button is-link is-fullwidth" onclick="saveGuests('${jumpCat}')">NEXT</button>`;
};

window.saveGuests = async (jumpCat = null) => {
    const val = document.getElementById('guestCount').value;
    if (!val) return;
    chatData.guests = val;
    renderMessage(`${val} guests`, "user"); clearInputs();
    if (jumpCat && jumpCat !== 'null') routeToSub(jumpCat); else selectVendorStep();
};

window.selectVendorStep = async () => {
    clearInputs();
    await renderMessage("What do you need help with today?");
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askFoodType()">🚚 Food/Catering</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askRentals()">⛺ Rentals</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askQuotes('Jumpers/Slides')">🏰 Jumpers/Slides</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askQuotes('Cakes/Sweets')">🍰 Cakes/Sweets</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askPhotoType()">📸 Photo/Booth</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="askQuotes('Transportation')">🚐 Transport</button></div>
        </div>`;
};

// --- ROUTING & CATEGORY SYNC ---

window.jumpToCategory = async (category) => {
    toggleChat(false); 
    clearInputs();
    if (chatData.eventDate) {
        await renderMessage(`Added ${category} to your request!`);
        routeToSub(category);
    } else {
        await renderMessage(`I'll add ${category}, but let's get your details first!`);
        document.getElementById('chat-controls').innerHTML = `
            <input class="input is-medium mb-2" type="date" id="eventDate">
            <button class="button is-link is-fullwidth" onclick="saveDate('${category}')">NEXT</button>`;
    }
};

function routeToSub(cat) {
    const syncCat = cat.replace(' & ', '/'); // Matches DB 'Tables/Chairs'
    if (syncCat === 'Food/Catering') askFoodType();
    else if (syncCat === 'Rentals') askRentals();
    else if (syncCat === 'Photo/Booth') askPhotoType();
    else askQuotes(syncCat);
}

window.askRentals = async () => {
    clearInputs(); renderMessage("Rentals", "user");
    await renderMessage("What kind of setup do you need?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Tents/Shade')">⛺ Tents & Shade</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Tables/Chairs')">🪑 Tables & Chairs</button>
        <button class="button is-info is-light is-fullwidth" onclick="askQuotes('Full Rental Package')">📦 Full Setup</button>`;
};

window.askFoodType = async () => {
    clearInputs(); renderMessage("Food", "user");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Taco Truck')">🌮 Taco Truck</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('BBQ Truck')">🍖 BBQ Truck</button>
        <button class="button is-info is-light is-fullwidth" onclick="askQuotes('Full Catering')">🍽️ Full Catering</button>`;
};

window.askPhotoType = async () => {
    clearInputs(); renderMessage("Photography", "user");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Photobooth Rental')">🎟️ Photobooth</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Family/Event Photo')">📸 Photographer</button>`;
};

window.askQuotes = async (type) => {
    clearInputs(); renderMessage(type, "user");
    await renderMessage(`How many quotes for ${type}? (1-3)`);
    document.getElementById('chat-controls').innerHTML = `
        <div class="buttons is-centered">
            <button class="button is-info" onclick="saveVendor('${type}', 1)">1</button>
            <button class="button is-info" onclick="saveVendor('${type}', 2)">2</button>
            <button class="button is-info" onclick="saveVendor('${type}', 3)">3</button>
        </div>`;
};

window.saveVendor = async (type, count) => {
    chatData.vendors.push({ type, count }); clearInputs();
    await renderMessage(`Added ${type}. Need anything else?`);
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link btn-oversized" onclick="selectVendorStep()">YES, ADD MORE</button>
        <button class="button is-light btn-oversized" onclick="askName()">NO, THAT'S ALL</button>`;
};

// --- CONTACT & COMPLETION ---

window.askName = async () => {
    clearInputs(); renderMessage("Ready", "user");
    await renderMessage("Excellent. What is your full name?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="text" id="custName" placeholder="Full Name">
        <button class="button is-link is-fullwidth" onclick="askPhone()">NEXT</button>`;
};

window.askPhone = async () => {
    chatData.name = document.getElementById('custName').value;
    if (!chatData.name) return;
    renderMessage(chatData.name, "user"); clearInputs();
    await renderMessage("And a contact number for the vendors?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="tel" id="custPhone" placeholder="520-XXX-XXXX">
        <button class="button is-link is-fullwidth" onclick="askEmail()">NEXT</button>`;
};

window.askEmail = async () => {
    chatData.phone = document.getElementById('custPhone').value;
    if (!chatData.phone) return;
    renderMessage(chatData.phone, "user"); clearInputs();
    await renderMessage("Lastly, what's your email?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="email" id="custEmail" placeholder="name@example.com">
        <button class="button is-link is-fullwidth" onclick="askConsent()">NEXT</button>`;
};

window.askConsent = async () => {
    chatData.email = document.getElementById('custEmail').value;
    if (!chatData.email) return;
    renderMessage(chatData.email, "user"); clearInputs();
    await renderMessage("By clicking below, you agree to connect with Tucson professionals via Theory Solutions. 🌵");
    document.getElementById('chat-controls').innerHTML = `<button class="button is-success is-fullwidth is-large" onclick="finish()">✅ I AGREE & CONNECT ME</button>`;
};

window.finish = async () => {
    chatData.marketingConsent = true;
    clearInputs();
    await renderMessage("Success! Your request has been sent. Check your inbox shortly! 🌵");
    await pushToSupabase(chatData); // Triggers Round Robin logic
};

function toggleChat(forceCollapse = null) {
    const widget = document.getElementById('chat-widget');
    const icon = document.getElementById('chat-toggle-icon');
    const shouldCollapse = (forceCollapse !== null) ? forceCollapse : !widget.classList.contains('collapsed');
    if (shouldCollapse) { widget.classList.add('collapsed'); if (icon) icon.innerText = '+'; } 
    else { widget.classList.remove('collapsed'); if (icon) icon.innerText = '−'; }
}