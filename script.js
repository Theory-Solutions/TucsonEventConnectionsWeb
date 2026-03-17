// ═══════════════════════════════════════════════════════════════════
//  TUCSON EVENT CONNECTIONS — CHATBOT v2.1
//  Changes: Added Catering sub-menu (General Catering, Donuts),
//           Food Truck, Food Cart options under Food category.
//           Updated vendor onboarding with Donut Catering.
// ═══════════════════════════════════════════════════════════════════

// --- CONFIGURATION & SECURITY ---
const SB_URL  = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/dispatch-call';
const VONT_URL = 'https://vksrsmxjrpnjtfwvhjin.supabase.co/functions/v1/vendor-onboarding';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrc3JzbXhqcnBuanRmd3ZoamluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTAzMDEsImV4cCI6MjA4ODA2NjMwMX0.cSTaLQXlQzMAP65xJGT24qz1p3cCr0WyA3oVL8Q3HMg';
const THEORY_AUTH = 'Tucson-Lead-2026';

// --- INPUT SANITIZATION ---
function sanitizeText(raw, maxLen = 500) {
    if (!raw || typeof raw !== 'string') return '';
    let clean = raw.replace(/<[^>]*>/g, '');
    const tmp = document.createElement('div');
    tmp.textContent = clean;
    clean = tmp.textContent;
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean.substring(0, maxLen);
}

// --- SESSION PERSISTENCE ---
const CHAT_KEY  = 'tec_chat_data';
const MSG_KEY   = 'tec_chat_msgs';
const STATE_KEY = 'tec_chat_state';

function loadChatData() {
    try { const s = sessionStorage.getItem(CHAT_KEY); if (s) return JSON.parse(s); } catch(e) {}
    return {
        vendors: [], name: '', phone: '', email: '', eventDate: '', guests: '',
        budget: '', eventType: '', notes: '',
        isVendorFlow: false, businessName: '', vendorCat: '', marketingConsent: false
    };
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
        const d = document.getElementById('chat-display');
        if (d) sessionStorage.setItem(MSG_KEY, d.innerHTML);
    } catch(e) {}
}
function loadChatMessages() {
    try { return sessionStorage.getItem(MSG_KEY) || ''; } catch(e) { return ''; }
}
function clearSession() {
    try { sessionStorage.removeItem(CHAT_KEY); sessionStorage.removeItem(MSG_KEY); sessionStorage.removeItem(STATE_KEY); } catch(e) {}
}

let chatData = loadChatData();

// ─── PRICING & CATEGORY KNOWLEDGE BASE ─────────────────────────────
const tucsonPricing = {
    "Catering / Food Truck / Food Carts": "$10–$20 per person",
    "Donut Catering": "$3–$8 per dozen",
    "Rentals (Tables, Chairs, Shade Tents)": "$2–$15 per item/setup",
    "Jumping Houses / Slides": "$150–$450 per day",
    "Photography / Photo Booth / Videography": "$300–$1,500 per event",
    "Cakes / Sweets / Treats": "$50–$350 custom orders",
    "Transportation / Shuttles / Limos": "$125–$250 per hour",
    "Music / DJ": "$450–$1,200 per event",
    "Decor / Balloons / Pinatas": "$80–$400 per setup"
};

// ─── DYNAMIC PATH RESOLVER ─────────────────────────────────────────
const _inTucsonFolder = window.location.pathname.toLowerCase().includes('/tucson/');
function resolvePath(file) {
    if (file.startsWith('tucson/')) {
        return _inTucsonFolder ? file.replace('tucson/', '') : file;
    }
    return _inTucsonFolder ? '../' + file : file;
}

// Tips shown in help mode
const categoryTips = {
    "Rentals":       { emoji: "⛺", tip: "Tables, chairs & shade tents — essential for outdoor Tucson events. Most rental vendors carry all three, so one booking usually covers you.", price: "$2–$15 per item", link: "tucson/tables-chairs.html" },
    "Catering":      { emoji: "🍽️", tip: "Full-service catering for any event size. Great for weddings, corporate events, and large parties where you need a complete menu.", price: "$15–$30 per person", link: "tucson/catering.html" },
    "Food Trucks":   { emoji: "🚚", tip: "Food trucks are huge in Tucson! Great for casual events. Budget ~$10–$20/head. Many trucks offer taco bars, BBQ, and fusion options.", price: "$10–$20 per person", link: "tucson/catering.html" },
    "Donut Catering": { emoji: "🍩", tip: "Donut walls, donut bars, and bulk donut catering — perfect for birthdays, office events, brunch parties, and wedding dessert tables.", price: "$3–$8 per dozen", link: "tucson/catering.html" },
    "Inflatables":   { emoji: "🏰", tip: "Bounce houses & slides are a hit for kids' parties. Tucson heat means early morning or evening setups work best. Most vendors include delivery & setup.", price: "$150–$450 per day", link: "tucson/jumping-houses.html" },
    "Photo/Video":   { emoji: "📸", tip: "Photo booths are popular for parties & corporate events. For weddings, book a photographer + videographer combo to save. Golden hour in the desert is unbeatable.", price: "$300–$1,500 per event", link: "tucson/photography.html" },
    "Cakes/Sweets":  { emoji: "🍰", tip: "Tucson has amazing local bakers for custom cakes, cupcakes, and dessert tables. Order at least 2–3 weeks ahead for custom designs.", price: "$50–$350 custom", link: "tucson/cakes.html" },
    "Transportation": { emoji: "🚐", tip: "Shuttles are smart for venue parking issues. Party buses work for bachelor/ette events. Limos for weddings — book early, Tucson has limited fleet.", price: "$125–$250 per hour", link: "tucson/transportation.html" },
    "Music/DJ":      { emoji: "🎵", tip: "DJs handle most Tucson events — bilingual DJs are popular for quinceañeras & multicultural events. Live bands typically start at $1,500+.", price: "$450–$1,200 per event", link: "tucson/music-dj.html" },
    "Decor":         { emoji: "🎈", tip: "Balloon arches, piñatas & themed decor. For outdoor events, ask about wind-resistant setups — Tucson breezes are real! Many vendors offer setup + teardown.", price: "$80–$400 per setup", link: "tucson/decor.html" }
};

// Event type definitions with recommended categories
const eventTypes = [
    { label: "🎂 Birthday Party",             key: "Birthday Party",        recs: ["Inflatables","Cakes/Sweets","Decor","Photo/Video","Donut Catering"] },
    { label: "💍 Wedding",                     key: "Wedding",               recs: ["Catering","Photo/Video","Music/DJ","Decor","Rentals","Transportation"] },
    { label: "🎓 Graduation",                  key: "Graduation",            recs: ["Catering","Rentals","Photo/Video","Decor"] },
    { label: "🏢 Corporate Event",             key: "Corporate Event",       recs: ["Catering","Rentals","Photo/Video","Music/DJ","Donut Catering"] },
    { label: "👶 Baby Shower",                 key: "Baby Shower",           recs: ["Cakes/Sweets","Decor","Rentals","Photo/Video"] },
    { label: "🎉 Quinceañera / Sweet 16",      key: "Quinceañera / Sweet 16", recs: ["Catering","Music/DJ","Photo/Video","Decor","Rentals","Transportation"] },
    { label: "🏘️ Block Party / Community",     key: "Block Party",           recs: ["Inflatables","Catering","Music/DJ","Rentals","Food Trucks"] },
    { label: "🤷 Something else",              key: "Other",                 recs: [] }
];

// Quick-nav links for site sections
const navLinks = {
    "Browse All Services":   "index.html#services",
    "Terms & Privacy":       "legal.html"
};

// ═══════════════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════════════
function scrollToBottom() { const d = document.getElementById('chat-display'); d.scrollTop = d.scrollHeight; }
function clearInputs() { document.getElementById('chat-controls').innerHTML = ''; }
function focusInput(id) { setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 100); }

async function renderMessage(text, side = 'bot') {
    const display = document.getElementById('chat-display');
    const msg = document.createElement('div');
    msg.className = side === 'bot' ? 'chat-msg bot-msg' : 'chat-msg user-msg';
    if (side === 'bot') {
        msg.innerText = '...';
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

async function renderHTML(html, side = 'bot') {
    const display = document.getElementById('chat-display');
    const msg = document.createElement('div');
    msg.className = side === 'bot' ? 'chat-msg bot-msg' : 'chat-msg user-msg';
    msg.innerText = '...';
    display.appendChild(msg);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 600));
    msg.innerHTML = html;
    scrollToBottom();
    saveChatMessages();
}

function helpFooter() {
    return `<div style="display:flex;gap:6px;margin-top:8px;">
        <button class="button is-light is-small" style="flex:1;" onclick="showHelp()">❓ Help</button>
        <button class="button is-light is-small" style="flex:1;" onclick="showNav()">🧭 Navigate</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  STARTUP & SESSION RESTORE
// ═══════════════════════════════════════════════════════════════════
window.onload = () => {
    setTimeout(() => {
        const widget = document.getElementById('chat-widget');
        const isCategoryPage = widget.getAttribute('style') && widget.getAttribute('style').includes('display');
        const savedState = loadChatState();
        const savedMsgs = loadChatMessages();

        if (savedState !== 'fresh' && savedState !== 'submitted' && savedState !== 'started' &&
            (chatData.eventDate || chatData.name || chatData.vendors.length > 0 || chatData.isVendorFlow)) {

            widget.style.display = 'flex';
            widget.classList.remove('collapsed');
            if (savedMsgs) document.getElementById('chat-display').innerHTML = savedMsgs;

            renderMessage("Welcome back! Your quote info is saved. 🌵");

            if (savedState === 'recap' && chatData.email)               showRecap();
            else if (savedState === 'vendors' || savedState === 'selectVendor') selectVendorStep();
            else if (chatData.email)                                    showRecap();
            else if (chatData.eventType)                                selectVendorStep();
            else if (chatData.budget)                                   askEventType();
            else if (chatData.guests)                                   askBudget();
            else if (chatData.eventDate) {
                renderMessage("How many guests?");
                document.getElementById('chat-controls').innerHTML =
                    `<input class="input mb-2" type="number" id="gCount" value="${chatData.guests}" placeholder="e.g. 50">` +
                    `<button class="button is-link is-fullwidth" onclick="saveGuests()">NEXT</button>` + helpFooter();
                focusInput('gCount');
            } else startChat();
        } else {
            if (savedState === 'submitted') { clearSession(); chatData = loadChatData(); }
            startChat();
            if (isCategoryPage) { widget.style.display = 'none'; }
            else { widget.style.display = 'flex'; widget.classList.add('collapsed'); }
        }
    }, 1500);
};

// ═══════════════════════════════════════════════════════════════════
//  HELP & NAVIGATION MODE
// ═══════════════════════════════════════════════════════════════════
window.showHelp = async () => {
    clearInputs(); saveChatState('help');
    await renderMessage("No problem — let me help you figure out what you need! 🌵");
    await renderMessage("Tap any category below to learn more about it, see Tucson pricing, and decide if it's right for your event:");

    const cats = Object.keys(categoryTips);
    const btns = cats.map(c => {
        const t = categoryTips[c];
        return `<div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="showCategoryHelp('${c}')">${t.emoji} ${c}</button></div>`;
    }).join('');

    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin:0;">${btns}</div>
        <hr style="margin:8px 0;">
        <button class="button is-link is-small is-fullwidth mb-1" onclick="showEventTypeHelp()">🎉 Not sure? Tell me your event type</button>
        <button class="button is-success is-small is-fullwidth mb-1" onclick="resumeOrStart()">✅ I'm ready — start my quote</button>
        <button class="button is-light is-small is-fullwidth" onclick="showNav()">🧭 Navigate the site</button>`;
    scrollToBottom();
};

window.showCategoryHelp = async (cat) => {
    const t = categoryTips[cat];
    if (!t) return;
    await renderMessage(cat, 'user');
    await renderHTML(
        `<strong>${t.emoji} ${cat}</strong><br>` +
        `${t.tip}<br><br>` +
        `<strong>Avg. Tucson Price:</strong> ${t.price}<br>` +
        (t.link ? `<a href="${resolvePath(t.link)}" target="_blank" style="color:#2AA198;">Learn more on our site →</a>` : '')
    );
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link is-small is-fullwidth mb-1" onclick="showHelp()">⬅️ Back to categories</button>
        <button class="button is-success is-small is-fullwidth" onclick="resumeOrStart()">✅ Start my quote</button>`;
    scrollToBottom();
};

window.showEventTypeHelp = async () => {
    clearInputs();
    await renderMessage("What type of event are you planning?");
    const btns = eventTypes.map(t =>
        `<div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveEventType('${t.key}', true)">${t.label}</button></div>`
    ).join('');
    document.getElementById('chat-controls').innerHTML =
        `<div class="columns is-mobile is-multiline" style="margin:0;">${btns}</div>`;
    scrollToBottom();
};

window.askEventType = async () => {
    clearInputs(); saveChatState('eventType');
    await renderMessage("What type of event are you planning? This helps us recommend the right vendors.");
    const btns = eventTypes.map(t =>
        `<div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveEventType('${t.key}', false)">${t.label}</button></div>`
    ).join('');
    document.getElementById('chat-controls').innerHTML =
        `<div class="columns is-mobile is-multiline" style="margin:0;">${btns}</div>` + helpFooter();
    scrollToBottom();
};

window.saveEventType = async (key, isHelpMode) => {
    chatData.eventType = key; persistChat();
    const match = eventTypes.find(t => t.key === key);
    await renderMessage(match ? match.label : key, 'user');
    clearInputs();

    if (chatData.email) { showRecap(); return; }

    const recs = match ? match.recs : [];
    if (!recs || recs.length === 0) {
        await renderMessage("No worries! You can browse all our categories and pick what fits.");
        document.getElementById('chat-controls').innerHTML =
            `<button class="button is-success is-small is-fullwidth mb-1" onclick="selectVendorStep()">✅ Choose my services</button>` +
            (isHelpMode ? `<button class="button is-light is-small is-fullwidth" onclick="showHelp()">⬅️ Back to help</button>` : '');
    } else {
        const recList = recs.map(r => {
            const t = categoryTips[r];
            return t ? `${t.emoji} <strong>${r}</strong> — ${t.price}` : `• ${r}`;
        }).join('<br>');
        await renderHTML(
            `For a typical <strong>${key}</strong> in Tucson, we'd recommend:<br><br>${recList}`
        );
        await renderMessage("Ready to pick your services? I'll walk you through it.");
        document.getElementById('chat-controls').innerHTML =
            `<button class="button is-success is-small is-fullwidth mb-1" onclick="selectVendorStep()">✅ Choose my services</button>` +
            (isHelpMode ? `<button class="button is-light is-small is-fullwidth" onclick="showHelp()">⬅️ Back to help</button>` : '');
    }
    scrollToBottom();
};

window.showNav = async () => {
    clearInputs();
    await renderMessage("Here are some quick links to help you find what you need:");
    const links = Object.entries(navLinks).map(([label, href]) =>
        `<a href="${resolvePath(href)}" class="button is-small is-fullwidth mb-1" style="justify-content:flex-start;">${label}</a>`
    ).join('');

    const catLinks = Object.entries(categoryTips)
        .filter(([, t]) => t.link)
        .map(([cat, t]) =>
            `<a href="${resolvePath(t.link)}" class="button is-light is-small is-fullwidth mb-1" style="justify-content:flex-start;">${t.emoji} ${cat}</a>`
        ).join('');

    document.getElementById('chat-controls').innerHTML =
        `<div style="max-height:220px;overflow-y:auto;">
            <p style="font-size:0.8rem;font-weight:600;margin:0 0 6px;color:#555;">Site Pages</p>
            ${links}
            <p style="font-size:0.8rem;font-weight:600;margin:10px 0 6px;color:#555;">Service Categories</p>
            ${catLinks}
        </div>
        <hr style="margin:8px 0;">
        <button class="button is-link is-small is-fullwidth" onclick="resumeOrStart()">✅ Start / continue my quote</button>`;
    scrollToBottom();
};

window.resumeOrStart = () => {
    const s = loadChatState();
    if (chatData.email)                   { showRecap(); }
    else if (chatData.eventType)          { selectVendorStep(); }
    else if (chatData.budget)             { askEventType(); }
    else if (chatData.guests)             { askBudget(); }
    else if (chatData.eventDate)          {
        renderMessage("How many guests?");
        document.getElementById('chat-controls').innerHTML =
            `<input class="input mb-2" type="number" id="gCount" value="${chatData.guests}" placeholder="e.g. 50">` +
            `<button class="button is-link is-fullwidth" onclick="saveGuests()">NEXT</button>` + helpFooter();
        focusInput('gCount');
    }
    else { handleInitial(true); }
};

// ═══════════════════════════════════════════════════════════════════
//  VENDOR INTAKE FLOW  (updated categories with Donut Catering)
// ═══════════════════════════════════════════════════════════════════
window.openVendorIntake = async () => {
    chatData = {
        vendors: [], name: '', phone: '', email: '', eventDate: '', guests: '',
        budget: '', eventType: '', notes: '', isVendorFlow: true, businessName: '', vendorCat: '', marketingConsent: false
    };
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
    if (yes) { renderMessage("Yes, start application", "user"); askBizName(); }
};

window.askBizName = async () => {
    clearInputs();
    await renderMessage("What is the name of your Business?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" id="vBiz" value="${chatData.businessName}" placeholder="Business Name">` +
        `<button class="button is-link is-fullwidth" onclick="saveBizName()">NEXT</button>`;
    focusInput('vBiz');
};

window.saveBizName = async () => {
    const val = document.getElementById('vBiz').value; if (!val) return;
    chatData.businessName = val; persistChat(); await renderMessage(val, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage("Which primary category do you serve in Tucson?");
    // ─── UPDATED VENDOR CATEGORIES (added Donut Catering) ──────────
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Catering')">🍽️ Catering</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Donut Catering')">🍩 Donut Catering</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Food Truck')">🚚 Food Truck</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Food Cart')">🛒 Food Cart</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Rentals')">⛺ Rentals</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Inflatables')">🏰 Inflatables</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Photography')">📸 Photo/Video</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Cakes/Sweets')">🍰 Sweets</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Transportation')">🚐 Transport</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Music/DJ')">🎵 Music/DJ</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveVendorCat('Decor')">🎈 Decor</button></div>
            <div class="column is-12 p-1"><button class="button is-dark is-small is-fullwidth" onclick="askOtherCat()">❌ NOT LISTED / OTHER</button></div>
        </div>`;
};

window.askOtherCat = async () => {
    clearInputs();
    await renderMessage("No problem! What service do you provide?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" id="vOther" placeholder="e.g. Security, Lighting">` +
        `<button class="button is-link is-fullwidth" onclick="saveVendorCat(document.getElementById('vOther').value)">NEXT</button>`;
    focusInput('vOther');
};

window.saveVendorCat = async (cat) => {
    chatData.vendorCat = cat; persistChat();
    await renderMessage(cat, "user");
    if (chatData.email) { showRecap(); } else { askName(); }
};

// ═══════════════════════════════════════════════════════════════════
//  PLANNER FLOW
// ═══════════════════════════════════════════════════════════════════
async function startChat() {
    chatData.isVendorFlow = false; clearInputs(); saveChatState('started');
    await renderMessage("Hey, I'm the Theory Assistant! 👋");
    await renderMessage("I can help you find & compare Tucson event vendors — or just answer questions about what you might need.");
    document.getElementById('chat-controls').innerHTML = `
        <button class="button is-link is-fullwidth mb-2" onclick="handleInitial(true)">📝 GET QUOTES</button>
        <button class="button is-info is-light is-fullwidth mb-2" onclick="showHelp()">❓ HELP ME DECIDE</button>
        <button class="button is-light is-fullwidth" onclick="showNav()">🧭 BROWSE THE SITE</button>`;
}

window.handleInitial = async (yes) => {
    clearInputs();
    if (!yes) { await renderMessage("No problem! Come back soon."); return; }
    await renderMessage("Let's do it!", "user");
    await renderMessage("Great! What is the event date?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" type="date" id="eDate" value="${chatData.eventDate}">` +
        `<button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>` + helpFooter();
    focusInput('eDate');
};

window.saveDate = async () => {
    const val = document.getElementById('eDate').value; if (!val) return;
    chatData.eventDate = val; persistChat(); saveChatState('date');
    await renderMessage(val, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage("How many guests?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" type="number" id="gCount" value="${chatData.guests}" placeholder="e.g. 50">` +
        `<button class="button is-link is-fullwidth" onclick="saveGuests()">NEXT</button>` + helpFooter();
    focusInput('gCount');
};

window.saveGuests = async () => {
    const val = document.getElementById('gCount').value; if (!val) return;
    chatData.guests = val; persistChat(); saveChatState('guests');
    await renderMessage(`${val} guests`, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    askBudget();
};

window.askBudget = async () => {
    clearInputs(); saveChatState('budget');
    await renderMessage("What's your estimated budget range for the full event?");
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('Under $500')">Under $500</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('$500 – $1,000')">$500 – $1K</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('$1,000 – $2,500')">$1K – $2.5K</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('$2,500 – $5,000')">$2.5K – $5K</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('$5,000 – $10,000')">$5K – $10K</button></div>
            <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBudget('$10,000+')">$10K+</button></div>
            <div class="column is-12 p-1"><button class="button is-light is-small is-fullwidth" onclick="saveBudget('Not sure yet')">Not sure yet</button></div>
        </div>` + helpFooter();
    scrollToBottom();
};

window.saveBudget = async (range) => {
    chatData.budget = range; persistChat(); saveChatState('budgetDone');
    await renderMessage(range, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    askEventType();
};

// ─── Vendor/Service Selection (UPDATED — Food sub-menu) ────────────
window.selectVendorStep = async () => {
    clearInputs(); saveChatState('selectVendor');
    await renderMessage("What do you need help with?");
    document.getElementById('chat-controls').innerHTML = `
        <div class="columns is-mobile is-multiline" style="margin: 0;">
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Food')">🍽️ Food</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Rentals')">⛺ Rentals</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Inflatables')">🏰 Inflatables</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Photo')">📸 Photo/Video</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Cakes')">🍰 Cakes/Sweets</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Transportation')">🚐 Transport</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Music')">🎵 Music/DJ</button></div>
            <div class="column is-6 p-1"><button class="button is-info is-light is-small is-fullwidth" onclick="routeToSub('Decor')">🎈 Decor</button></div>
        </div>
        ${chatData.email ? '<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>' : ''}
        ${helpFooter()}`;
    scrollToBottom();
};

window.jumpToCategory = async (cat) => {
    toggleChat(false);
    if (chatData.eventDate) { await renderMessage(`Adding ${cat}...`); routeToSub(cat); }
    else { await renderMessage("Let's get your date first!"); document.getElementById('chat-controls').innerHTML = `<input class="input mb-2" type="date" id="eDate"><button class="button is-link is-fullwidth" onclick="saveDate()">NEXT</button>` + helpFooter(); focusInput('eDate'); }
};

// ─── NEW: Catering sub-menu (General Catering → sub-types) ─────────
window.routeToCateringSub = async () => {
    clearInputs();
    await renderMessage("What type of catering?");
    const backBtn = chatData.email
        ? `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>`
        : `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="routeToSub('Food')">⬅️ BACK</button>`;
    document.getElementById('chat-controls').innerHTML = `
        <div class="buttons is-centered" style="flex-wrap:wrap;">
            <button class="button is-small" onclick="askQuotes('Catering')" title="Not sure what type — general catering">General Catering</button>
            <button class="button is-small" onclick="askQuotes('Donut Catering')">🍩 Donuts</button>
        </div>
        <p style="font-size:0.7rem;color:#888;text-align:center;margin:4px 0 8px;">More catering types coming soon!</p>
        ${backBtn}`;
    scrollToBottom();
};

function routeToSub(cat) {
    clearInputs();
    const ctrl = document.getElementById('chat-controls');
    const backBtn = chatData.email
        ? `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>`
        : `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="selectVendorStep()">⬅️ BACK</button>`;

    // ─── UPDATED: Food → Catering / Food Truck / Food Cart ─────────
    //     Catering → General Catering / Donuts (expandable)
    if (cat === 'Food' || cat.includes('Catering') && !cat.includes('Donut')) {
        ctrl.innerHTML = `
            <div class="buttons is-centered" style="flex-wrap:wrap;">
                <button class="button is-small" onclick="routeToCateringSub()">🍽️ Catering</button>
                <button class="button is-small" onclick="askQuotes('Food Truck')">🚚 Food Truck</button>
                <button class="button is-small" onclick="askQuotes('Food Cart')">🛒 Food Cart</button>
            </div>${backBtn}`;
    } else if (cat.includes('Rental') || cat.includes('Tables') || cat.includes('Chairs') || cat.includes('Tent')) {
        ctrl.innerHTML = `<div class="buttons is-centered">
            <button class="button is-small" onclick="askQuotes('Tables/Chairs')">Tables & Chairs</button>
            <button class="button is-small" onclick="askQuotes('Shade Tents')">Shade Tents</button>
            <button class="button is-small" onclick="askQuotes('Rentals Full Package')">Full Package</button>
        </div>${backBtn}`;
    } else if (cat.includes('Inflatable') || cat.includes('Jumper') || cat.includes('Slide')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Jumpers/Slides')">Jumpers & Slides</button></div>${backBtn}`;
    } else if (cat.includes('Photo')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Photography')">Photo</button><button class="button is-small" onclick="askQuotes('Photo Booth')">Booth</button><button class="button is-small" onclick="askQuotes('Videography')">Video</button></div>${backBtn}`;
    } else if (cat.includes('Cake') || cat.includes('Sweet')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Cakes')">Cakes</button><button class="button is-small" onclick="askQuotes('Sweets/Treats')">Sweets</button></div>${backBtn}`;
    } else if (cat.includes('Transport')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Transportation')">Transport</button></div>${backBtn}`;
    } else if (cat.includes('Music') || cat.includes('DJ')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('DJ')">DJ</button><button class="button is-small" onclick="askQuotes('Live Band')">Live Band</button></div>${backBtn}`;
    } else if (cat.includes('Decor')) {
        ctrl.innerHTML = `<div class="buttons is-centered"><button class="button is-small" onclick="askQuotes('Decor')">Decor</button><button class="button is-small" onclick="askQuotes('Balloons')">Balloons</button></div>${backBtn}`;
    } else { askQuotes(cat); }
    scrollToBottom();
}

window.askQuotes = async (type) => {
    clearInputs();
    await renderMessage(`How many quotes for ${type}?`);
    const backBtn = chatData.email
        ? `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="showRecap()">⬅️ DONE EDITING</button>`
        : `<button class="button is-danger is-light is-small is-fullwidth mt-2" onclick="selectVendorStep()">⬅️ BACK</button>`;
    document.getElementById('chat-controls').innerHTML =
        `<div class="buttons is-centered">
            <button class="button is-info" onclick="saveVendor('${type}', 1)">1</button>
            <button class="button is-info" onclick="saveVendor('${type}', 2)">2</button>
            <button class="button is-info" onclick="saveVendor('${type}', 3)">3</button>
        </div>${backBtn}`;
    scrollToBottom();
};

window.saveVendor = async (type, count) => {
    chatData.vendors.push({ type, count }); persistChat(); saveChatState('vendors');
    await renderMessage(`${count} quotes for ${type}`, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    await renderMessage("Got it. Need anything else?");
    document.getElementById('chat-controls').innerHTML =
        `<button class="button is-link is-fullwidth mb-2" onclick="selectVendorStep()">YES, ADD MORE</button>` +
        `<button class="button is-light is-fullwidth" onclick="askName()">NO, THAT'S ALL</button>`;
};

// ═══════════════════════════════════════════════════════════════════
//  CONTACT INFO, NOTES & RECAP
// ═══════════════════════════════════════════════════════════════════
window.askName = async () => {
    clearInputs();
    await renderMessage("Excellent. What is your full name?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" id="cName" value="${sanitizeText(chatData.name)}" placeholder="Full Name">` +
        `<button class="button is-link is-fullwidth" onclick="saveName()">NEXT</button>` + helpFooter();
    focusInput('cName');
};
window.saveName = async () => {
    const val = document.getElementById('cName').value; if (!val) return;
    chatData.name = sanitizeText(val, 100); persistChat();
    await renderMessage(chatData.name, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    askPhone();
};

window.askPhone = async () => {
    clearInputs();
    await renderMessage("What's a good contact number?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" id="cPhone" value="${sanitizeText(chatData.phone)}" placeholder="520-XXX-XXXX">` +
        `<button class="button is-link is-fullwidth" onclick="savePhone()">NEXT</button>` + helpFooter();
    focusInput('cPhone');
};
window.savePhone = async () => {
    const val = document.getElementById('cPhone').value; if (!val) return;
    chatData.phone = sanitizeText(val, 20); persistChat();
    await renderMessage(chatData.phone, "user"); clearInputs();
    if (chatData.email) { showRecap(); return; }
    askEmail();
};

window.askEmail = async () => {
    clearInputs();
    await renderMessage("And your email?");
    document.getElementById('chat-controls').innerHTML =
        `<input class="input mb-2" id="cEmail" value="${sanitizeText(chatData.email)}" placeholder="email@example.com">` +
        `<button class="button is-link is-fullwidth" onclick="saveEmail()">NEXT</button>` + helpFooter();
    focusInput('cEmail');
};
window.saveEmail = async () => {
    const val = document.getElementById('cEmail').value; if (!val) return;
    chatData.email = sanitizeText(val, 120); persistChat();
    await renderMessage(chatData.email, "user"); clearInputs();
    if (chatData.notes || loadChatState() === 'recap') { showRecap(); return; }
    askNotes();
};

window.askNotes = async () => {
    clearInputs(); saveChatState('notes');
    await renderMessage("Almost done! Any special requests or details you'd like vendors to know? (optional)");
    document.getElementById('chat-controls').innerHTML =
        `<textarea class="textarea mb-2" id="cNotes" rows="3" maxlength="500"
            placeholder="e.g. Need setup by 2pm, bilingual DJ preferred, gluten-free options...">${sanitizeText(chatData.notes)}</textarea>
        <div style="display:flex;gap:6px;">
            <button class="button is-link" style="flex:1;" onclick="saveNotes()">SAVE NOTE</button>
            <button class="button is-light" style="flex:1;" onclick="saveNotes(true)">SKIP</button>
        </div>`;
    focusInput('cNotes');
};

window.saveNotes = async (skip) => {
    if (!skip) {
        const raw = document.getElementById('cNotes').value;
        chatData.notes = sanitizeText(raw, 500);
    }
    persistChat();
    if (chatData.notes) {
        await renderMessage(chatData.notes, "user");
    } else {
        await renderMessage("No notes — skipped", "user");
    }
    clearInputs();
    showRecap();
};

window.showRecap = async () => {
    const emailInput = document.getElementById('cEmail');
    if (emailInput) chatData.email = sanitizeText(emailInput.value, 120);
    persistChat(); saveChatState('recap');
    clearInputs();
    await renderMessage("Please review your details. Tap any item to change it:");

    if (chatData.isVendorFlow) {
        await renderMessage(
            `🏢 Business: ${chatData.businessName}\n` +
            `🛠️ Category: ${chatData.vendorCat}\n` +
            `👤 Contact: ${chatData.name}\n` +
            `📞 Phone: ${chatData.phone}\n` +
            `📧 Email: ${chatData.email}`
        );
        document.getElementById('chat-controls').innerHTML = `
            <div class="columns is-multiline is-mobile" style="margin: 0;">
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askBizName()">🏢 Business</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveBizName()">🛠️ Category</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askName()">👤 Name</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askPhone()">📞 Phone</button></div>
                <div class="column is-12 p-1"><button class="button is-small is-fullwidth" onclick="askEmail()">📧 Edit Email</button></div>
            </div>
            <hr style="margin: 10px 0;">
            <button class="button is-success is-medium is-fullwidth" onclick="askConsent()">✅ EVERYTHING IS CORRECT</button>`;
    } else {
        const serviceRecap = chatData.vendors.length > 0
            ? chatData.vendors.map(v => `${v.type} (${v.count})`).join(', ')
            : 'None';
        await renderMessage(
            `👤 Name: ${chatData.name}\n` +
            `📞 Phone: ${chatData.phone}\n` +
            `📧 Email: ${chatData.email}\n` +
            `📅 Date: ${chatData.eventDate}\n` +
            `👥 Guests: ${chatData.guests}\n` +
            `💰 Budget: ${chatData.budget || 'Not specified'}\n` +
            `🎉 Event Type: ${chatData.eventType || 'Not specified'}\n` +
            `🛠️ Services: ${serviceRecap}\n` +
            `📝 Notes: ${chatData.notes || 'None'}`
        );
        document.getElementById('chat-controls').innerHTML = `
            <div class="columns is-multiline is-mobile" style="margin: 0;">
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askName()">👤 Name</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askPhone()">📞 Phone</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="handleInitial(true)">📅 Date</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="saveDate()">👥 Guests</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askBudget()">💰 Budget</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askEventType()">🎉 Event Type</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="askEmail()">📧 Email</button></div>
                <div class="column is-6 p-1"><button class="button is-small is-fullwidth" onclick="selectVendorStep()">🛠️ Services (${chatData.vendors.length})</button></div>
                <div class="column is-12 p-1"><button class="button is-small is-fullwidth" onclick="askNotes()">📝 Notes</button></div>
            </div>
            <hr style="margin: 10px 0;">
            <button class="button is-success is-medium is-fullwidth" onclick="askConsent()">✅ EVERYTHING IS CORRECT</button>`;
    }
    scrollToBottom();
};

// ═══════════════════════════════════════════════════════════════════
//  CONSENT & SUBMISSION
// ═══════════════════════════════════════════════════════════════════
window.askConsent = async () => {
    clearInputs();
    await renderMessage("By submitting, you agree to our Terms and Privacy Statement. 🌵");
    document.getElementById('chat-controls').innerHTML = `
        <div class="box has-background-white-ter p-3 mb-2" style="border: 1px solid #ddd; font-size: 0.85rem;">
            <label class="checkbox"><input type="checkbox" id="legalCheck"> I agree to the <a href="${resolvePath('legal.html')}" target="_blank">Terms & Privacy Policy</a></label>
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
    await renderMessage(chatData.isVendorFlow
        ? "Partner application sent! 🌵"
        : "Request submitted! 🎉");

    if (!chatData.isVendorFlow) {
        await renderMessage("We're a brand-new platform growing our vendor network here in Tucson. We'll do our best to match you with a great vendor — if we're unable to find the right fit, someone from our team will reach out to you directly to help.");
        await renderMessage("Keep an eye on your email — you'll hear from us soon! 🌵");
    }

    const targetUrl = chatData.isVendorFlow ? VONT_URL : SB_URL;

    if (!chatData.isVendorFlow && chatData.vendors.length > 0) {
        for (const vendor of chatData.vendors) {
            await pushToSupabase({ ...chatData, vendors: [vendor] }, targetUrl);
        }
    } else {
        await pushToSupabase(chatData, targetUrl);
    }

    clearSession();
    saveChatState('submitted');
};

async function pushToSupabase(payload, url) {
    if (!payload.email) return;
    const safePayload = {
        ...payload,
        notes: sanitizeText(payload.notes, 500),
        name: sanitizeText(payload.name, 100),
        phone: sanitizeText(payload.phone, 20),
        eventType: sanitizeText(payload.eventType, 60),
        businessName: sanitizeText(payload.businessName, 150)
    };
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`,
                'X-Theory-Auth': THEORY_AUTH
            },
            body: JSON.stringify(safePayload)
        });
    } catch (err) { console.error("Error:", err); }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAWER & TOGGLE
// ═══════════════════════════════════════════════════════════════════
window.openDrawer = (title, desc, mediaUrl, categoryUrl) => {
    document.getElementById('drawer-title').innerText = title;
    document.getElementById('drawer-desc').innerHTML =
        `${desc}<br><br><strong>Avg. Price:</strong> ${tucsonPricing[title] || "Request Quote"}<br><hr>` +
        `<small><a href="${resolvePath('legal.html')}" target="_blank">Terms & Disclaimer</a></small>`;
    document.getElementById('drawer-media-box').style.backgroundImage = `url('${mediaUrl}')`;
    document.getElementById('drawer').classList.add('is-active');
    document.getElementById('overlay').classList.add('is-active');
    document.getElementById('drawer-action-btn').onclick = () => { closeDrawer(); jumpToCategory(title); };

    const learnMoreEl = document.getElementById('drawer-learn-more');
    if (learnMoreEl) {
        if (categoryUrl) { learnMoreEl.href = categoryUrl; learnMoreEl.style.display = 'block'; }
        else { learnMoreEl.style.display = 'none'; }
    }
};

window.closeDrawer = () => {
    document.getElementById('drawer').classList.remove('is-active');
    document.getElementById('overlay').classList.remove('is-active');
};

window.toggleChat = (force) => {
    const w = document.getElementById('chat-widget');
    if (!w) return;
    if (w.style.display === 'none') w.style.display = 'flex';
    const shouldCollapse = force !== undefined ? force : !w.classList.contains('collapsed');
    if (shouldCollapse) {
        w.classList.add('collapsed');
    } else {
        w.classList.remove('collapsed');
        const display = document.getElementById('chat-display');
        if (display && display.children.length === 0) {
            const savedState = loadChatState();
            if (savedState === 'fresh' || !savedState) startChat();
        }
    }
};