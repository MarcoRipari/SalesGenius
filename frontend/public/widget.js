(function() {
  'use strict';

  // Get widget key from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-widget-key]');
  const widgetKey = scriptTag?.dataset?.widgetKey;
  
  if (!widgetKey) {
    console.error('SalesGenius: Widget key not found. Add data-widget-key attribute to the script tag.');
    return;
  }

  // Configuration
  const API_BASE = scriptTag?.dataset?.apiUrl || 'https://condescending-poitras-1.preview.emergentagent.com/api';
  
  // State
  let isOpen = false;
  let sessionId = localStorage.getItem('sg_session_' + widgetKey) || generateSessionId();
  let config = null;
  let messages = [];
  let cartCount = 0;

  function generateSessionId() {
    const id = 'sg_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sg_session_' + widgetKey, id);
    return id;
  }

  // Styles
  const styles = `
    #sg-widget-container * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #sg-widget-bubble {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--sg-primary, #F97316);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 999998;
    }
    
    #sg-widget-bubble:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(0,0,0,0.25);
    }
    
    #sg-widget-bubble svg {
      width: 28px;
      height: 28px;
    }
    
    #sg-widget-bubble.sg-left {
      right: auto;
      left: 20px;
    }
    
    .sg-cart-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #sg-widget-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      animation: sg-slide-up 0.3s ease-out;
    }
    
    #sg-widget-window.sg-open {
      display: flex;
    }
    
    #sg-widget-window.sg-left {
      right: auto;
      left: 20px;
    }
    
    @keyframes sg-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    #sg-widget-header {
      background: var(--sg-primary, #F97316);
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    #sg-widget-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    #sg-widget-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    #sg-widget-avatar svg {
      width: 24px;
      height: 24px;
    }
    
    #sg-widget-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    #sg-widget-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      opacity: 0.9;
    }
    
    #sg-widget-status::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: sg-pulse 2s infinite;
    }
    
    @keyframes sg-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    #sg-widget-close {
      margin-left: auto;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    #sg-widget-close:hover {
      background: rgba(255,255,255,0.3);
    }
    
    #sg-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }
    
    .sg-message {
      max-width: 90%;
      animation: sg-fade-in 0.3s ease-out;
    }
    
    @keyframes sg-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .sg-message-text {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .sg-message.sg-bot .sg-message-text {
      background: white;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    
    .sg-message.sg-bot {
      align-self: flex-start;
    }
    
    .sg-message.sg-user {
      align-self: flex-end;
    }
    
    .sg-message.sg-user .sg-message-text {
      background: var(--sg-primary, #F97316);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
    
    /* Product Cards */
    .sg-products-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    
    .sg-product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .sg-product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    
    .sg-product-image {
      width: 100%;
      height: 100px;
      object-fit: cover;
      background: #f1f5f9;
    }
    
    .sg-product-image-placeholder {
      width: 100%;
      height: 100px;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }
    
    .sg-product-info {
      padding: 10px;
    }
    
    .sg-product-name {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .sg-product-price {
      font-size: 14px;
      font-weight: 700;
      color: var(--sg-primary, #F97316);
      margin: 0 0 8px 0;
    }
    
    .sg-product-actions {
      display: flex;
      gap: 6px;
    }
    
    .sg-product-btn {
      flex: 1;
      padding: 8px 6px;
      border: none;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      text-decoration: none;
      text-align: center;
    }
    
    .sg-product-btn:hover {
      opacity: 0.9;
    }
    
    .sg-btn-primary {
      background: var(--sg-primary, #F97316);
      color: white;
      flex: 1;
    }
    
    .sg-btn-disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      flex: 1;
    }
    
    .sg-typing {
      display: flex;
      gap: 4px;
      padding: 16px;
      align-self: flex-start;
    }
    
    .sg-typing span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: sg-bounce 1.4s infinite ease-in-out;
    }
    
    .sg-typing span:nth-child(1) { animation-delay: -0.32s; }
    .sg-typing span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes sg-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    #sg-widget-input-area {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    
    #sg-widget-input {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 12px 18px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    #sg-widget-input:focus {
      border-color: var(--sg-primary, #F97316);
    }
    
    #sg-widget-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--sg-primary, #F97316);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
    }
    
    #sg-widget-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    #sg-widget-send svg {
      width: 20px;
      height: 20px;
    }
    
    #sg-widget-powered {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #94a3b8;
      background: white;
    }
    
    #sg-widget-powered a {
      color: var(--sg-primary, #F97316);
      text-decoration: none;
    }
    
    /* Toast notification */
    .sg-toast {
      position: fixed;
      bottom: 160px;
      right: 30px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: sg-toast-in 0.3s ease-out;
      z-index: 1000000;
    }
    
    @keyframes sg-toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 480px) {
      #sg-widget-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: 10px;
        left: 10px;
        border-radius: 12px;
      }
      
      #sg-widget-window.sg-left {
        left: 10px;
        right: 10px;
      }
      
      .sg-products-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  // Icons
  const icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
  };

  // Create widget
  async function init() {
    // Fetch config
    try {
      const res = await fetch(`${API_BASE}/widget/public/${widgetKey}`);
      if (!res.ok) throw new Error('Widget not found');
      config = await res.json();
    } catch (e) {
      console.error('SalesGenius: Failed to load widget config', e);
      return;
    }

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Set CSS variable for primary color
    document.documentElement.style.setProperty('--sg-primary', config.primary_color || '#F97316');

    // Create container
    const container = document.createElement('div');
    container.id = 'sg-widget-container';
    
    const isLeft = config.position === 'bottom-left';

    container.innerHTML = `
      <button id="sg-widget-bubble" class="${isLeft ? 'sg-left' : ''}" aria-label="Open chat">
        ${icons.chat}
        <span class="sg-cart-badge" id="sg-cart-badge" style="display:none">0</span>
      </button>
      <div id="sg-widget-window" class="${isLeft ? 'sg-left' : ''}">
        <div id="sg-widget-header">
          <div id="sg-widget-avatar">
            ${config.avatar_url ? `<img src="${config.avatar_url}" alt="Avatar">` : icons.bot}
          </div>
          <div id="sg-widget-info">
            <h4>${config.bot_name || 'SalesGenius'}</h4>
            <div id="sg-widget-status">Online</div>
          </div>
          <button id="sg-widget-close" aria-label="Close chat">${icons.close}</button>
        </div>
        <div id="sg-widget-messages"></div>
        <div id="sg-widget-input-area">
          <input type="text" id="sg-widget-input" placeholder="Cerca un prodotto o fai una domanda..." />
          <button id="sg-widget-send" aria-label="Send">${icons.send}</button>
        </div>
        <div id="sg-widget-powered">Powered by <a href="https://salesgenius.ai" target="_blank">SalesGenius</a></div>
      </div>
    `;

    document.body.appendChild(container);

    // Load history
    await loadHistory();

    // If no history, add welcome message
    if (messages.length === 0) {
      addMessage(config.welcome_message || 'Ciao! Come posso aiutarti? Cerca un prodotto o fammi una domanda!', 'bot');
    }

    // Event listeners
    document.getElementById('sg-widget-bubble').addEventListener('click', toggleWidget);
    document.getElementById('sg-widget-close').addEventListener('click', toggleWidget);
    document.getElementById('sg-widget-send').addEventListener('click', sendMessage);
    document.getElementById('sg-widget-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function toggleWidget() {
    isOpen = !isOpen;
    const window = document.getElementById('sg-widget-window');
    const bubble = document.getElementById('sg-widget-bubble');
    
    if (isOpen) {
      window.classList.add('sg-open');
      bubble.innerHTML = icons.close + '<span class="sg-cart-badge" id="sg-cart-badge" style="' + (cartCount > 0 ? '' : 'display:none') + '">' + cartCount + '</span>';
      document.getElementById('sg-widget-input').focus();
    } else {
      window.classList.remove('sg-open');
      bubble.innerHTML = icons.chat + '<span class="sg-cart-badge" id="sg-cart-badge" style="' + (cartCount > 0 ? '' : 'display:none') + '">' + cartCount + '</span>';
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/chat/history/${sessionId}`);
      if (res.ok) {
        const history = await res.json();
        const messagesEl = document.getElementById('sg-widget-messages');
        messagesEl.innerHTML = '';
        messages = [];
        
        history.forEach(msg => {
          addMessage(msg.content, msg.role === 'assistant' ? 'bot' : 'user', msg.products, false);
        });
      }
    } catch (e) {
      console.error('SalesGenius: Failed to load history', e);
    }
  }

  function addMessage(text, type, products = null, scroll = true) {
    const messagesEl = document.getElementById('sg-widget-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `sg-message sg-${type}`;
    
    let html = `<div class="sg-message-text">${escapeHtml(text)}</div>`;
    
    // Add product cards if available
    if (products && products.length > 0) {
      html += '<div class="sg-products-grid">';
      products.forEach(product => {
        html += createProductCard(product);
      });
      html += '</div>';
    }
    
    msgEl.innerHTML = html;
    messagesEl.appendChild(msgEl);
    messages.push({ text, type, products });
    
    // Attach event listeners to product buttons
    if (products) {
      msgEl.querySelectorAll('.sg-btn-cart').forEach(btn => {
        btn.addEventListener('click', () => addToCart(btn.dataset.productId, btn.dataset.productName));
      });
    }
    
    if (scroll) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function createProductCard(product) {
    const imageHtml = product.image_url 
      ? `<img src="${escapeHtml(product.image_url)}" class="sg-product-image" alt="${escapeHtml(product.name)}" onerror="this.outerHTML='<div class=\\'sg-product-image-placeholder\\'>${icons.image}</div>'">`
      : `<div class="sg-product-image-placeholder">${icons.image}</div>`;
    
    return `
      <div class="sg-product-card">
        ${imageHtml}
        <div class="sg-product-info">
          <h5 class="sg-product-name">${escapeHtml(product.name || 'Prodotto')}</h5>
          <p class="sg-product-price">${escapeHtml(product.price || 'Prezzo su richiesta')}</p>
          <div class="sg-product-actions">
            ${product.product_url ? `<a href="${escapeHtml(product.product_url)}" target="_blank" class="sg-product-btn sg-btn-primary">Vedi Prodotto</a>` : '<span class="sg-product-btn sg-btn-disabled">Link non disponibile</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function addToCart(productId, productName) {
    try {
      const res = await fetch(`${API_BASE}/cart/add?product_id=${productId}&session_id=${sessionId}&widget_key=${widgetKey}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        cartCount++;
        updateCartBadge();
        showToast(`${productName} aggiunto al carrello!`);
        
        // Notify parent window if callback exists
        if (window.SalesGeniusOnCartAdd) {
          window.SalesGeniusOnCartAdd({ productId, productName, sessionId });
        }
      }
    } catch (e) {
      console.error('SalesGenius: Error adding to cart', e);
    }
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('#sg-cart-badge');
    badges.forEach(badge => {
      badge.textContent = cartCount;
      badge.style.display = cartCount > 0 ? 'flex' : 'none';
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'sg-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }

  function showTyping() {
    const messagesEl = document.getElementById('sg-widget-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'sg-typing';
    typingEl.id = 'sg-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const typingEl = document.getElementById('sg-typing');
    if (typingEl) typingEl.remove();
  }

  async function sendMessage() {
    const input = document.getElementById('sg-widget-input');
    const sendBtn = document.getElementById('sg-widget-send');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Add user message
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    
    // Show typing indicator
    showTyping();
    
    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          widget_key: widgetKey
        })
      });
      
      hideTyping();
      
      if (res.ok) {
        const data = await res.json();
        addMessage(data.content, 'bot', data.products);
      } else {
        addMessage('Mi scuso, si è verificato un errore. Riprova più tardi.', 'bot');
      }
    } catch (e) {
      hideTyping();
      addMessage('Mi scuso, non riesco a connettermi. Controlla la tua connessione.', 'bot');
    }
    
    sendBtn.disabled = false;
    input.focus();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API for parent window
  window.SalesGenius = {
    open: () => { if (!isOpen) toggleWidget(); },
    close: () => { if (isOpen) toggleWidget(); },
    getSessionId: () => sessionId,
    getCartCount: () => cartCount
  };
})();
