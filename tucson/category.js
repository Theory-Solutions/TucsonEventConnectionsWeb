document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-item__q').addEventListener('click', () => {
            const wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
        });
    });

    // Scroll animations
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.anim').forEach(el => observer.observe(el));

    // Nav scroll effect
    const nav = document.querySelector('.cat-nav');
    if (nav) window.addEventListener('scroll', () => {
        nav.style.boxShadow = window.scrollY > 20 ? '0 4px 20px rgba(0,0,0,0.3)' : 'none';
    });
});

// Bridge to open chat with a specific category
function openChatForCategory(cat) {
    const widget = document.getElementById('chat-widget');
    if (widget) {
        widget.style.display = 'flex';
        widget.classList.remove('collapsed');
        
        // If chat hasn't rendered messages yet, start it
        const display = document.getElementById('chat-display');
        if (display && display.children.length === 0) {
            if (typeof startChat === 'function') startChat();
        }
        
        // Then jump to the category
        setTimeout(() => {
            if (typeof jumpToCategory === 'function') {
                jumpToCategory(cat);
            }
        }, 800);
    }
}
