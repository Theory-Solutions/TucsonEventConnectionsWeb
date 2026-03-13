// --- CONFIGURATION & SECURITY ---
const SB_URL = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/dispatch-call';
const VONT_URL = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/vendor-onboarding';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc3JzbXhqcnBuanRmd3ZoamluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTAzMDEsImV4cCI6MjA4ODA2NjMwMX0.cSTaLQXlQzMAP65xJGT24qz1p3cCr0WyA3oVL8Q3HMg';
const THEORY_AUTH = 'Tucson-Lead-2026';

// --- SESSION PERSISTENCE ---
// Load existing chat state from sessionStorage (survives page navigations)
const CHAT_KEY = 'tec_chat_data';
const MSG_KEY = 'tec_chat_msgs';
const STATE_KEY = 'tec_chat_state'; // tracks where user is in the flow

function loadChatData() {
    try {
        const saved = sessionStorage.getItem(CHAT_KEY);
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { vendors: [], name: '', phone: '', email: '', eventDate: '', guests: '',
             isVendorFlow: false, businessName: '', vendorCat: '', marketingConsent: false };
}

function persistChat() {
    try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(chatData)); } catch(e) {}
}

function saveChatState(state) {
    try { sessionStorage.setItem(STATE_KEY, state); } catch(e) {}
}

function loadChatState() {
    try { return sessionStorage.getItem(STATE_KEY) || 'fresh'; } catch(e) { return 'fresh'; }
}

function saveChatMessages() {
    try {
        const display = document.getElementById('chat-display');
        if (display) sessionStorage.setItem(MSG_KEY, display.innerHTML);
    } catch(e) {}
}

function loadChatMessages() {
    try { return sessionStorage.getItem(MSG_KEY) || ''; } catch(e) { return ''; }
}

function clearSession() {
    try { sessionStorage.removeItem(CHAT_KEY); sessionStorage.removeItem(MSG_KEY); sessionStorage.removeItem(STATE_KEY); } catch(e) {}
}

let chatData = loadChatData();

const tucsonPricing = {
    "Catering / Food Truck / Food Carts": "$10-$20 per person",
    "Tables / Chairs / Tents": "$2-$15 per item/setup",
    "Jumping Houses / Slides": "$150-$450 per day",
    "Photography / Photo Booth / Videography": "$300-$1500 per event",
    "Cakes / Sweets / Treats": "$50-$350 custom orders",
    "Transportation / Shuttles / Limos": "$125-$250 per hour",
    "Music / DJ": "$450-$1200 per event",
    "Decor / Balloons / Pinatas": "$80-$400 per setup"
};

// --- STARTUP & UI HELPERS ---
window.onload = () => { 
    setTimeout(() => { 
        const widget = document.getElementById('chat-widget');
        
        // Detect category pages (widget starts hidden in their HTML)
        const isCategoryPage = widget.getAttribute('style') && widget.getAttribute('style').includes('display');
        
        const savedState = loadChatState();
        const savedMsgs = loadChatMessages();
        
        // If user has an in-progress session, restore it expanded
        if (savedState !== 'fresh' && savedState !== 'submitted' && savedState !== 'started' && (chatData.eventDate || chatData.name || chatData.vendors.length > 0 || chatData.isVendorFlow)) {
            widget.style.display = 'flex';
            widget.classList.remove('collapsed');
            
            if (savedMsgs) {
                document.getElementById('chat-display').innerHTML = savedMsgs;
            }
            
            renderMessage("Welcome back! Your quote info is saved. 🌵");
            
            if (savedState === 'recap' && chatData.email) {
                showRecap();
            } else if (savedState === 'vendors' || savedState === 'selectVendor') {
                selectVendorStep();
            } else if (chatData.email) {
                showRecap();
            } else if (chatData.guests) {
                selectVendorStep();
            } else if (chatData.eventDate) {
                renderMessage("How many guests?");
                document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" type="number" id="gCount" value="${chatData.guests}" placeholder="e.g. 50"><button class="button is-link is-fullwidth" onclick="saveGuests()">NEXT</button>`;
                focusInput('gCount');
            } else {
                startChat();
            }
        } else {
            // Fresh or submitted — clear old data if needed
            if (savedState === 'submitted') {
                clearSession();
                chatData = loadChatData();
            }
            
            // Always initialize chat so it's ready when opened
            startChat();
            
            if (isCategoryPage) {
                // Category pages: stay hidden until CTA clicked
                widget.style.display = 'none';
            } else {
                // Homepage: show as collapsed FAB bubble
                widget.style.display = 'flex';
                widget.classList.add('collapsed');
            }
        }
    }, 1500); 
};
function scrollToBottom() { const display = document.getElementById('chat-display'); display.scrollTop = display.scrollHeight; }
function clearInputs() { document.getElementById('chat-controls').innerHTML = ''; }
function focusInput(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 100); }

async function renderMessage(text, side = 'bot') {
    const display = document.getElementById('chat-display');
    const msg = document.createElement('div');
    msg.className = side === 'bot' ? 'chat-msg bot-msg' : 'chat-msg user-msg';
    
    if (side === 'bot') { 
        msg.innerText = "..."; 
        display.appendChild(msg); 
        scrollToBottom(); 
        await new Promise(r => setTimeout(r, 600)); 
        msg.innerText = text;
    } else {
        msg.innerText = text;
        display.appendChild(msg);
    }
    scrollToBottom();
    saveChatMessages();
}

// --- VENDOR INTAKE FLOW ---
window.openVendorIntake = async () => {
    chatData = { vendors: [], name: '', phone: '', email: '', eventDate: '', guests: '', isVendorFlow: true, businessName: '', vendorCat: '', marketingConsent: false };
    persistChat(); saveChatState('vendorFlow');
    document.getElementById('chat-display').innerHTML = ''; 
    toggleChat(false); clearInputs();
    await renderMessage("Welcome to the Theory Solutions Partner Network! 🌵");
    await renderMessage("Ready to join and receive Tucson leads?");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-warning is-fullwidth mb-2" onclick="handleVendorStart(true)">YES, START APPLICATION</button>
        <button class="button is-light is-fullwidth" onclick="startChat()">NO, I'M A PLANNER</button>`;
};

window.handleVendorStart = async (yes) => {
    if(yes) { renderMessage("Yes, start application", "user"); askBizName(); }
};

window.askBizName = async () => {
    clearInputs(); await renderMessage("What is the name of your Business?");
    document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" id="vBiz" value="${chatData.businessName}" placeholder="Business Name"><button class="button is-link is-fullwidth" onclick="saveBizName()">NEXT</button>`;
    focusInput('vBiz');
};

window.saveBizName = async () => {
    const val = document.getElementById('vBiz').value; if (!val) return;
    chatData.businessName = val; persistChat(); await renderMessage(val, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage("Which primary category do you serve in Tucson?");
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Catering')">Catering</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Tables/Chairs')">Tables/Chairs</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Jumpers/Slides')">Inflatables</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Photography')">Media</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Cakes')">Sweets</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Transportation')">Transport</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Music')">Music/DJ</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Decor')">Decor</button></div>
            <div class="column is-12 p-1"><button class="button is-dark is-small is-fullwidth" onclick="askOtherCat()">❌ NOT LISTED / OTHER</button></div>
        </div>`;
};

window.askOtherCat = async () => {
    clearInputs(); await renderMessage("No problem! What service do you provide?");
    document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" id="vOther" placeholder="e.g. Security, Lighting"><button class="button is-link is-fullwidth" onclick="saveVendorCat(document.getElementById('vOther').value)">NEXT</button>`;
    focusInput('vOther');
};

window.saveVendorCat = async (cat) => { chatData.vendorCat = cat; persistChat(); await renderMessage(cat, "user"); if (chatData.email) { showRecap(); } else { askName(); } };

// --- PLANNER FLOW ---
async function startChat() {
    chatData.isVendorFlow = false; clearInputs(); saveChatState('started');
    await renderMessage("Hey, I'm the Theory Assistant! 👋");
    await renderMessage("Ready to find some vendors for your Tucson event?");
    document.getElementById('chat-controls').innerHTML = `<button class="button is-link is-fullwidth mb-2" onclick="handleInitial(true)">YES</button><button class="button is-light is-fullwidth" onclick="handleInitial(false)">NO</button>`;
}

window.handleInitial = async (yes) => {
    clearInputs(); if (!yes) { await renderMessage("No problem! Come back soon."); return; }
    await renderMessage("Yes", "user"); await renderMessage("Great! What is the event date?");
    document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" type="date" id="eDate" value="${chatData.eventDate}"><button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>`;
    focusInput('eDate');
};

window.saveDate = async () => {
    const val = document.getElementById('eDate').value; if (!val) return;
    chatData.eventDate = val; persistChat(); saveChatState('date'); await renderMessage(val, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage("How many guests?");
    document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" type="number" id="gCount" value="${chatData.guests}" placeholder="e.g. 50"><button class="button is-link is-fullwidth" onclick="saveGuests()">NEXT</button>`;
    focusInput('gCount');
};

window.saveGuests = async () => {
    const val = document.getElementById('gCount').value; if (!val) return;
    chatData.guests = val; persistChat(); saveChatState('guests'); await renderMessage(`${val} guests`, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    selectVendorStep();
};

window.selectVendorStep = async () => {
    clearInputs(); saveChatState('selectVendor'); await renderMessage("What do you need help with?");
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Catering')">🚚 Food</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Tables/Chairs')">⛺ Tables/Chairs</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Jumpers/Slides')">🏰 Inflatables</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Photo')">📸 Photo/Video</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Cakes')">🍰 Cakes/Sweets</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Transportation')">🚐 Transport</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Music')">🎵 Music/DJ</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Decor')">🎈 Decor</button></div>
        </div>
        ${chatData.email ? '<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>' : ''}`;
    scrollToBottom();
};

window.jumpToCategory = async (cat) => {
    toggleChat(false);
    if (chatData.eventDate) { await renderMessage(`Adding ${cat}...`); routeToSub(cat); } 
    else { await renderMessage(`Let's get your date first!`); document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" type="date" id="eDate"><button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>`; focusInput('eDate'); }
};

function routeToSub(cat) {
    clearInputs(); const ctrl = document.getElementById('chat-controls');
    const backBtn = chatData.email ? `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>` : `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="selectVendorStep()">⬅️ BACK</button>`;
    
    if (cat.includes('Catering') || cat.includes('Food')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Catering')">Catering</button></div>${backBtn}`; }
    else if (cat.includes('Tables') || cat.includes('Chairs')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Tables/Chairs')">Tables/Chairs</button></div>${backBtn}`; }
    else if (cat.includes('Jumpers') || cat.includes('Slides') || cat.includes('Inflatable')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Jumpers/Slides')">Jumpers/Slides</button></div>${backBtn}`; }
    else if (cat.includes('Photo')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Photography')">Photo</button><button class="button is-small" onclick="askQuotes('Photo Booth')">Booth</button></div>${backBtn}`; }
    else if (cat.includes('Cakes') || cat.includes('Sweets')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Cakes')">Cakes</button><button class="button is-small" onclick="askQuotes('Sweets')">Sweets</button></div>${backBtn}`; }
    else if (cat.includes('Transportation')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Transportation')">Transport</button></div>${backBtn}`; }
    else if (cat.includes('Music') || cat.includes('DJ')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('DJ')">DJ</button></div>${backBtn}`; }
    else if (cat.includes('Decor')) { ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Decor')">Decor</button></div>${backBtn}`; }
    else { askQuotes(cat); }
    scrollToBottom();
}

window.askQuotes = async (type) => {
    clearInputs(); await renderMessage(`How many quotes for ${type}?`);
    const backBtn = chatData.email ? `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>` : `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="selectVendorStep()">⬅️ BACK</button>`;
    document.getElementById('chat-controls').innerHTML = `<div class="buttons is-centered"><button class="button is-info" onclick="saveVendor('${type}', 1)">1</button><button class="button is-info" onclick="saveVendor('${type}', 2)">2</button><button class="button is-info" onclick="saveVendor('${type}', 3)">3</button></div>${backBtn}`;
    scrollToBottom();
};

window.saveVendor = async (type, count) => {
    chatData.vendors.push({ type, count }); persistChat(); saveChatState('vendors'); await renderMessage(`${count} quotes for ${type}`, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage(`Got it. Need anything else?`);
    document.getElementById('chat-controls').innerHTML = `<button class="button is-link is-fullwidth mb-2" onclick="selectVendorStep()">YES, ADD MORE</button><button class="button is-light is-fullwidth" onclick="askName()">NO, THAT'S ALL</button>`;
};

// --- CONTACT INFO & RECAP ---
window.askName = async () => { clearInputs(); await renderMessage("Excellent. What is your full name?"); document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" id="cName" value="${chatData.name}" placeholder="Full Name"><button class="button is-link is-fullwidth" onclick="saveName()">NEXT</button>`; focusInput('cName'); };
window.saveName = async () => { const val = document.getElementById('cName').value; if (!val) return; chatData.name = val; persistChat(); await renderMessage(val, "user"); clearInputs(); if (chatData.email) { showRecap(); return; } askPhone(); };
window.askPhone = async () => { clearInputs(); await renderMessage("What's a good contact number?"); document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" id="cPhone" value="${chatData.phone}" placeholder="520-XXX-XXXX"><button class="button is-link is-fullwidth" onclick="savePhone()">NEXT</button>`; focusInput('cPhone'); };
window.savePhone = async () => { const val = document.getElementById('cPhone').value; if (!val) return; chatData.phone = val; persistChat(); await renderMessage(val, "user"); clearInputs(); if (chatData.email) { showRecap(); return; } askEmail(); };
window.askEmail = async () => { clearInputs(); await renderMessage("And finally, your email?"); document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" id="cEmail" value="${chatData.email}" placeholder="email@example.com"><button class="button is-link is-fullwidth" onclick="showRecap()">RECAP MY REQUEST</button>`; focusInput('cEmail'); };

window.showRecap = async () => {
    const emailInput = document.getElementById('cEmail'); if (emailInput) chatData.email = emailInput.value;
    persistChat(); saveChatState('recap');
    clearInputs();
    await renderMessage("Please review your details. Click any item to change it:");
    
    if (chatData.isVendorFlow) {
        await renderMessage(`🏢 Business: ${chatData.businessName}\n🛠️ Category: ${chatData.vendorCat}\n👤 Contact: ${chatData.name}\n📞 Phone: ${chatData.phone}\n📧 Email: ${chatData.email}`);
        document.getElementById('chat-controls').innerHTML = `
            <div class="columns is-multiline is-mobile" style="margin: 0;">
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askBizName()">🏢 Business</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBizName()">🛠️ Category</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askName()">👤 Name</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askPhone()">📞 Phone</button></div>
                <div class="column is-12 p-1"><button class="button is-small is-fullwidth" onclick="askEmail()">📧 Edit Email</button></div>
            </div>
            <hr style="margin: 10px 0;"><button class="button is-success is-medium is-fullwidth" onclick="askConsent()">✅ EVERYTHING IS CORRECT</button>`;
    } else {
        const serviceRecap = chatData.vendors.length > 0 ? chatData.vendors.map(v => `${v.type} (${v.count})`).join(', ') : 'None';
        await renderMessage(`👤 Name: ${chatData.name}\n📞 Phone: ${chatData.phone}\n📧 Email: ${chatData.email}\n📅 Date: ${chatData.eventDate}\n👥 Guests: ${chatData.guests}\n🛠️ Services: ${serviceRecap}`);
        document.getElementById('chat-controls').innerHTML = `
            <div class="columns is-multiline is-mobile" style="margin: 0;">
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askName()">👤 Name</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askPhone()">📞 Phone</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="handleInitial(true)">📅 Date</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveDate()">👥 Guests</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askEmail()">📧 Email</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="selectVendorStep()">🛠️ Services (${chatData.vendors.length})</button></div>
            </div>
            <hr style="margin: 10px 0;"><button class="button is-success is-medium is-fullwidth" onclick="askConsent()">✅ EVERYTHING IS CORRECT</button>`;
    }
    scrollToBottom();
};

window.askConsent = async () => { 
    clearInputs(); 
    await renderMessage("By submitting, you agree to our Terms and Privacy Statement. 🌵"); 
    document.getElementById('chat-controls').innerHTML = `
        <div class="box has-background-white-ter p-3 mb-2" style="border: 1px solid #ddd; font-size: 0.85rem;">
            <label class="checkbox"><input type="checkbox" id="legalCheck"> I agree to the <a href="legal.html" target="_blank">Terms & Privacy Policy</a></label>
        </div>
        <button class="button is-success is-large is-fullwidth" onclick="handleFinalSubmission()">✅ I AGREE & SUBMIT</button>`; 
    scrollToBottom(); 
};

window.handleFinalSubmission = async () => {
    if (!document.getElementById('legalCheck').checked) { alert("Please agree to the terms."); return; }
    finish();
};

window.finish = async () => {
    chatData.marketingConsent = true; 
    clearInputs();
    await renderMessage(chatData.isVendorFlow ? "Partner application sent! 🌵" : "Request sent! Partners will contact you soon.");
    
    const targetUrl = chatData.isVendorFlow ? VONT_URL : SB_URL;

    if (!chatData.isVendorFlow && chatData.vendors.length > 0) {
        for (const vendor of chatData.vendors) {
            await pushToSupabase({ ...chatData, vendors: [vendor] }, targetUrl);
        }
    } else {
        await pushToSupabase(chatData, targetUrl);
    }
    
    // Clear session after successful submission
    clearSession();
    saveChatState('submitted');
};

async function pushToSupabase(payload, url) { 
    if (!payload.email) return; 
    try { 
        await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY}`, 'X-Theory-Auth': THEORY_AUTH }, 
            body: JSON.stringify(payload) 
        }); 
    } catch (err) { console.error("Error:", err); } 
}

// ─── MODIFIED: openDrawer now accepts categoryUrl (4th param) ───
window.openDrawer = (title, desc, mediaUrl, categoryUrl) => { 
    document.getElementById('drawer-title').innerText = title; 
    document.getElementById('drawer-desc').innerHTML = `${desc}<br><br><strong>Avg. Price:</strong> ${tucsonPricing[title] || "Request Quote"}<br><hr><small><a href="legal.html" target="_blank">Terms & Disclaimer</a></small>`; 
    document.getElementById('drawer-media-box').style.backgroundImage = `url('${mediaUrl}')`; 
    document.getElementById('drawer').classList.add('is-active'); 
    document.getElementById('overlay').classList.add('is-active'); 
    document.getElementById('drawer-action-btn').onclick = () => { closeDrawer(); jumpToCategory(title); }; 

    // ─── NEW: Set the "Learn More" link if a category URL exists ───
    const learnMoreEl = document.getElementById('drawer-learn-more');
    if (learnMoreEl) {
        if (categoryUrl) {
            learnMoreEl.href = categoryUrl;
            learnMoreEl.style.display = 'block';
        } else {
            learnMoreEl.style.display = 'none';
        }
    }
};

window.closeDrawer = () => { document.getElementById('drawer').classList.remove('is-active'); document.getElementById('overlay').classList.remove('is-active'); };
window.toggleChat = (force) => { 
    const w = document.getElementById('chat-widget'); 
    if (!w) return;
    
    // Show widget if hidden
    if (w.style.display === 'none') w.style.display = 'flex';
    
    const shouldCollapse = force !== undefined ? force : !w.classList.contains('collapsed'); 
    
    if (shouldCollapse) {
        w.classList.add('collapsed');
    } else {
        w.classList.remove('collapsed');
        // If chat hasn't started yet, kick it off
        const display = document.getElementById('chat-display');
        if (display && display.children.length === 0) {
            const savedState = loadChatState();
            if (savedState === 'fresh' || !savedState) {
                startChat();
            }
        }
    }
};
