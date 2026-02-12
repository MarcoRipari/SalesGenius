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
    
    #sg-widget-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 550px;
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
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      animation: sg-fade-in 0.3s ease-out;
    }
    
    @keyframes sg-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .sg-message.sg-bot {
      background: white;
      border-radius: 16px 16px 16px 4px;
      align-self: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    
    .sg-message.sg-user {
      background: var(--sg-primary, #F97316);
      color: white;
      border-radius: 16px 16px 4px 16px;
      align-self: flex-end;
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
    }
  `;

  // Icons
  const icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
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
          <input type="text" id="sg-widget-input" placeholder="Scrivi un messaggio..." />
          <button id="sg-widget-send" aria-label="Send">${icons.send}</button>
        </div>
        <div id="sg-widget-powered">Powered by <a href="https://salesgenius.ai" target="_blank">SalesGenius</a></div>
      </div>
    `;

    document.body.appendChild(container);

    // Load history
    await loadHistory();

    // Add welcome message if no history
    if (messages.length === 0) {
      addMessage(config.welcome_message || 'Ciao! Come posso aiutarti oggi?', 'bot');
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
      bubble.innerHTML = icons.close;
      document.getElementById('sg-widget-input').focus();
    } else {
      window.classList.remove('sg-open');
      bubble.innerHTML = icons.chat;
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
          addMessage(msg.content, msg.role === 'assistant' ? 'bot' : 'user', false);
        });
      }
    } catch (e) {
      console.error('SalesGenius: Failed to load history', e);
    }
  }

  function addMessage(text, type, scroll = true) {
    const messagesEl = document.getElementById('sg-widget-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `sg-message sg-${type}`;
    msgEl.textContent = text;
    messagesEl.appendChild(msgEl);
    messages.push({ text, type });
    
    if (scroll) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
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
        addMessage(data.content, 'bot');
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
})();
