// --- CONFIGURATION & SUPABASE STAGING ---
const SB_URL = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/dispatch-call';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc3JzbXhqcnBuanRmd3ZoamluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTAzMDEsImV4cCI6MjA4ODA2NjMwMX0.cSTaLQXlQzMAP65xJGT24qz1p3cCr0WyA3oVL8Q3HMg';

let chatData = { 
    vendors: [], 
    name: '', 
    phone: '', 
    email: '', 
    eventDate: '', 
    guests: '',
    marketingConsent: false,
    // B2B Staging Fields
    vendorName: '',
    vendorServiceType: '',
    vendorPhone: '',
    vendorEmail: '',
    vendorConsent: false
};

// --- CORE UTILITIES ---

window.onload = () => {
    setTimeout(() => {
        const widget = document.getElementById('chat-widget');
        if (widget) { 
            widget.style.display = 'flex'; 
            startChat(); 
        }
    }, 6000); // 6-second startup delay
};

async function pushToSupabase(payload) {
    try {
        const response = await fetch(SB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Supabase Error:", errorText);
        } else {
            const result = await response.json();
            console.log("Supabase Success:", result);
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
    }
}

async function renderMessage(text, side = 'bot') {
    const chatDisplay = document.getElementById('chat-display');
    const msgDiv = document.createElement('div');
    msgDiv.className = side === 'bot' ? 'chat-msg bot-msg' : 'chat-msg user-msg';
    if (side === 'bot') {
        msgDiv.innerText = "...";
        chatDisplay.appendChild(msgDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        await new Promise(res => setTimeout(res, 900));
        msgDiv.innerText = text;
    } else {
        msgDiv.innerText = text;
        chatDisplay.appendChild(msgDiv);
    }
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function clearInputs() { 
    document.getElementById('chat-controls').innerHTML = ''; 
}

// --- ENTRY POINTS: Planner vs Vendor ---

async function startChat() {
    clearInputs();
    await renderMessage("Hey, how's it going? I am Theory Assistant! 👋");
    await renderMessage("Our vision is to streamline local event connections for planners like you!");
    await renderMessage("Are you looking for some vendors for an event in Tucson?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link btn-oversized" onclick="handleInitial(true)">YES</button>
        <button class="button is-light btn-oversized" onclick="handleInitial(false)">NO</button>`;
}

window.handleInitial = async (isYes) => {
    clearInputs();
    if (!isYes) {
        renderMessage("No", "user");
        await renderMessage("No problem! I'm here if you change your mind.");
        document.getElementById('chat-controls').innerHTML = `
            <button class="button is-link is-outlined is-fullwidth" onclick="startChat()">🔄 RESTART ASSISTANT</button>`;
        return;
    }
    renderMessage("Yes", "user");
    await renderMessage("Great! When is the event date?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="date" id="eventDate">
        <button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>`;
};

// --- VENDOR SIGN-UP FLOW (B2B Staging) ---

window.openVendorPage = async () => {
    toggleChat(false); 
    clearInputs();
    
    const chatDisplay = document.getElementById('chat-display');
    chatDisplay.innerHTML = ''; // Wipe chat history for B2B clarity
    
    await renderMessage("Excellent! We are always looking for quality Tucson professionals to join our network. 🛠️");
    await renderMessage("What is the name of your business?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="text" id="vBizName" placeholder="Business Name">
        <button class="button is-link is-fullwidth" onclick="saveVendorBiz()">NEXT</button>`;
};

window.saveVendorBiz = async () => {
    const val = document.getElementById('vBizName').value;
    if (!val) return;
    chatData.vendorName = val; 
    renderMessage(val, "user"); clearInputs();
    await renderMessage("What types of events do you service? (e.g. Weddings, Corporate, Rentals)");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="text" id="vEventType" placeholder="Event Types">
        <button class="button is-link is-fullwidth" onclick="saveVendorEvents()">NEXT</button>`;
};

window.saveVendorEvents = async () => {
    const val = document.getElementById('vEventType').value;
    if (!val) return;
    chatData.vendorServiceType = val;
    renderMessage(val, "user"); clearInputs();
    await renderMessage("What is the best phone number for our partnership team to reach you?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="tel" id="vPhone" placeholder="520-XXX-XXXX">
        <button class="button is-link is-fullwidth" onclick="saveVendorPhone()">NEXT</button>`;
};

window.saveVendorPhone = async () => {
    const val = document.getElementById('vPhone').value;
    if (!val) return;
    chatData.vendorPhone = val;
    renderMessage(val, "user"); clearInputs();
    await renderMessage("And finally, your professional email address?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="email" id="vEmail" placeholder="email@business.com">
        <button class="button is-link is-fullwidth" onclick="askVendorConsent()">NEXT</button>`;
};

window.askVendorConsent = async () => {
    const val = document.getElementById('vEmail').value;
    if (!val) return;
    chatData.vendorEmail = val;
    renderMessage(val, "user"); clearInputs();

    await renderMessage("By clicking below, you agree to receive business updates from Tucson Event Connections.");
    await renderMessage("We have a formal review process for all partners. Theory Solutions is not liable for performance disputes.");
    
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-success is-fullwidth is-large mb-2" onclick="finishVendorSignup()">✅ I AGREE & APPLY</button>
        <button class="button is-light is-small is-fullwidth" onclick="startChat()">CANCEL</button>`;
};

window.finishVendorSignup = async () => {
    chatData.vendorConsent = true;
    clearInputs();
    await renderMessage("Thank you! Your application has been received.");
    await renderMessage("We will be in touch after reviewing your details. 🌵");
    
    await pushToSupabase(chatData);
};

// --- CONSUMER FLOW (Planner Leads) ---

window.jumpToCategory = async (category) => {
    toggleChat(false); 
    clearInputs();
    if (chatData.eventDate) {
        await renderMessage(`I've added ${category} to your request list!`);
        routeToSub(category);
    } else {
        await renderMessage(`I see you're interested in ${category}! Let's get your event details first.`);
        await renderMessage("When is the event date?");
        document.getElementById('chat-controls').innerHTML = `
            <input class="input is-medium mb-2" type="date" id="eventDate">
            <button class="button is-link is-fullwidth" onclick="saveDate('${category}')">NEXT</button>`;
    }
};

window.saveDate = async (jumpCat = null) => {
    const val = document.getElementById('eventDate').value;
    if (!val) return;
    chatData.eventDate = val;
    renderMessage(val, "user"); clearInputs();
    await renderMessage("How many guests are you expecting?");
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

// --- SUB-CATEGORY ROUTING ---

function routeToSub(cat) {
    if (cat === 'Food/Catering') askFoodType();
    else if (cat === 'Rentals') askRentals();
    else if (cat === 'Photo/Booth') askPhotoType();
    else askQuotes(cat);
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
    clearInputs(); renderMessage("Food/Catering", "user");
    await renderMessage("What type of food are you looking for?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Taco Truck')">🌮 Taco Truck</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('BBQ Truck')">🍖 BBQ Truck</button>
        <button class="button is-info is-light is-fullwidth" onclick="askQuotes('Full Catering')">🍽️ Full Catering</button>`;
};

window.askPhotoType = async () => {
    clearInputs(); renderMessage("Photography/Photobooth", "user");
    await renderMessage("What memories are we capturing?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Photobooth Rental')">🎟️ Photobooth</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="askQuotes('Family/Event Photo')">👨‍👩‍👧 Family/Event</button>
        <button class="button is-info is-light is-fullwidth" onclick="askQuotes('Wedding Photo')">💍 Wedding</button>`;
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
    await renderMessage(`Added ${type} for ${count} quotes.`);
    await renderMessage(`Need anything else?`);
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link btn-oversized" onclick="selectVendorStep()">YES, ADD MORE</button>
        <button class="button is-light btn-oversized" onclick="askName()">NO, THAT'S ALL</button>`;
};

// --- CONTACT & CONSENT ---

window.askName = async () => {
    clearInputs(); renderMessage("No more", "user");
    await renderMessage("Great! What is your full name?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="text" id="custName" placeholder="Full Name">
        <button class="button is-link is-fullwidth" onclick="askPhone()">NEXT</button>`;
};

window.askPhone = async () => {
    chatData.name = document.getElementById('custName').value;
    if (!chatData.name) return;
    renderMessage(chatData.name, "user"); clearInputs();
    await renderMessage("And a contact number?");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="tel" id="custPhone" placeholder="520-XXX-XXXX">
        <button class="button is-link is-fullwidth" onclick="askEmail()">NEXT</button>`;
};

window.askEmail = async () => {
    chatData.phone = document.getElementById('custPhone').value;
    if (!chatData.phone) return;
    renderMessage(chatData.phone, "user"); clearInputs();
    await renderMessage("Lastly, what's your email? We'll send your summary and Tucson Event Guide there! 🌵");
    document.getElementById('chat-controls').innerHTML = `
        <input class="input is-medium mb-2" type="email" id="custEmail" placeholder="name@example.com">
        <button class="button is-link is-fullwidth" onclick="askConsent()">NEXT</button>`;
};

window.askConsent = async () => {
    chatData.email = document.getElementById('custEmail').value;
    if (!chatData.email) return;
    renderMessage(chatData.email, "user"); clearInputs();
    await renderMessage("By clicking below, you agree to receive event updates from Tucson Event Connections.");
    await renderMessage("Disclaimer: Theory Solutions is a connection service and is not liable for vendor performance.");
    document.getElementById('chat-controls').innerHTML = `<button class="button is-success is-fullwidth is-large mb-2" onclick="finish()">✅ I AGREE & CONNECT ME</button>`;
};

window.finish = async () => {
    chatData.marketingConsent = true;
    clearInputs();
    await renderMessage("Perfect! Request sent. Check your inbox shortly for your Event Guide! 🌵");
    
    await pushToSupabase(chatData);
};

// --- INTERFACE UTILITIES ---

function openDrawer(title, desc, mediaUrl) {
    document.getElementById('drawer-title').innerText = title;
    document.getElementById('drawer-desc').innerText = desc;
    document.getElementById('drawer-media-box').style.backgroundImage = "url('" + mediaUrl + "')";
    document.getElementById('drawer').classList.add('is-active');
    document.getElementById('overlay').classList.add('is-active');
    document.getElementById('drawer-action-btn').onclick = () => {
        closeDrawer();
        jumpToCategory(title);
    };
}

function closeDrawer() {
    document.getElementById('drawer').classList.remove('is-active');
    document.getElementById('overlay').classList.remove('is-active');
}

window.toggleChat = (forceCollapse = null) => {
    const widget = document.getElementById('chat-widget');
    const icon = document.getElementById('chat-toggle-icon');
    const shouldCollapse = (forceCollapse !== null) ? forceCollapse : !widget.classList.contains('collapsed');
    if (shouldCollapse) { widget.classList.add('collapsed'); if (icon) icon.innerText = '+'; } 
    else { widget.classList.remove('collapsed'); if (icon) icon.innerText = '−'; }
};