# SalesGenius - AI Sales Assistant SaaS Platform

## Problem Statement
Build an AI-powered Digital Sales Assistant SaaS platform inspired by AutoCust (with different branding). Transform websites into interactive shopping experiences through an AI chatbot widget.

## User Personas
1. **Business Admin/Owner**: Full access, manages team, settings, billing
2. **Team Admin**: Full access to features, can invite members
3. **Team Member**: Manages knowledge base and views analytics
4. **Viewer**: Read-only access to dashboard and analytics
5. **Website Visitor**: Interacts with the chat widget, searches products, adds to cart

## Core Requirements (MVP - Implemented)
- [x] Landing page with marketing content
- [x] JWT-based authentication (register/login)
- [x] Admin Dashboard with analytics
- [x] Knowledge Base management (URL + PDF upload)
- [x] **Product Catalog with manual add/edit/delete**
- [x] **Product extraction from URLs (web scraping)**
- [x] **AI Product Search in chatbot**
- [x] **Product cards with images, prices, view & cart buttons**
- [x] **Shopping cart functionality**
- [x] Widget Configurator with live preview
- [x] Embeddable widget.js script
- [x] Conversation logs viewer
- [x] Lead management
- [x] Team Management with roles (Owner/Admin/Member/Viewer)
- [x] Admin Settings (Organization, Notifications, AI Config)
- [x] Light/Dark theme support
- [x] AI Chat (Gemini 3 Flash via Emergent LLM key)

## Architecture
- **Frontend**: React 19 + Shadcn UI + Framer Motion + TailwindCSS
- **Backend**: FastAPI + Motor (MongoDB async) + PyJWT + BeautifulSoup4
- **AI**: Gemini 3 Flash via emergentintegrations library
- **Database**: MongoDB

## What's Been Implemented

### Phase 1 - MVP
1. Full authentication system (JWT)
2. Dashboard with real-time analytics and charts
3. Knowledge Base CRUD (URL fetching, PDF parsing)
4. Widget Configurator with live preview
5. Conversation viewer
6. Lead management table
7. Account settings
8. Theme toggle (light/dark)

### Phase 2 - Team & Admin
1. widget.js - Embeddable chat widget script
2. Team Management - Invite members, assign roles
3. Admin Settings - Organization info, notifications, AI config
4. Role-based access control

### Phase 3 - Product Search (Current)
1. **Product Catalog Page** - View, add, edit, delete products
2. **Product Extraction** - Scrape products from URLs (JSON-LD, common e-commerce patterns)
3. **AI Product Search** - Bot searches products based on user queries
4. **Product Cards in Chat** - Images, prices, "View" and "Add to Cart" buttons
5. **Shopping Cart API** - Add/remove items, get cart contents

## Example Flow
```
User: "Cerco una scarpa da bambina rosa"
Bot: "Ho trovato questi prodotti:"
     [Product Card: Scarpa bambina rosa - €45,90]
     [Product Card: Scarpa bambina bianca - €52,00]
     Buttons: [Vedi Prodotto] [Aggiungi al Carrello]
```

## Widget Integration
```html
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://YOUR_APP_URL/widget.js';
    s.dataset.widgetKey = 'YOUR_WIDGET_KEY';
    document.body.appendChild(s);
  })();
</script>
```

## Cart Integration
The widget supports a callback for cart additions:
```javascript
window.SalesGeniusOnCartAdd = function(data) {
  // data: { productId, productName, sessionId }
  // Add to your e-commerce cart
};
```

## P0 Features (Next Phase)
- [ ] WhatsApp integration
- [ ] Email notifications for new leads (SMTP)
- [ ] Export leads/orders to CSV
- [ ] Checkout flow integration

## P1 Features
- [ ] Multi-language AI responses
- [ ] Product inventory sync
- [ ] Order tracking
- [ ] CRM integrations (Salesforce, HubSpot)

## AI Cost Model (Gemini 3 Flash)
- Input: €0.10/1M tokens
- Output: €0.40/1M tokens
- **~€0.0002 per conversation** (500 tokens avg)
