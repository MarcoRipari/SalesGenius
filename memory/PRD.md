# SalesGenius - AI Sales Assistant SaaS Platform

## Problem Statement
Build an AI-powered Digital Sales Assistant SaaS platform inspired by AutoCust (with different branding). Transform websites into interactive shopping experiences through an AI chatbot widget.

## User Personas
1. **Business Admin/Owner**: Full access, manages team, settings, billing
2. **Team Admin**: Full access to features, can invite members
3. **Team Member**: Manages knowledge base and views analytics
4. **Viewer**: Read-only access to dashboard and analytics
5. **Website Visitor**: Interacts with the chat widget

## Core Requirements (MVP - Implemented)
- [x] Landing page with marketing content
- [x] JWT-based authentication (register/login)
- [x] Admin Dashboard with analytics
- [x] Knowledge Base management (URL + PDF upload)
- [x] Widget Configurator with live preview
- [x] **Embeddable widget.js script**
- [x] Conversation logs viewer
- [x] Lead management
- [x] **Team Management with roles (Owner/Admin/Member/Viewer)**
- [x] **Admin Settings (Organization, Notifications, AI Config)**
- [x] Settings page
- [x] Light/Dark theme support
- [x] AI Chat (Gemini 3 Flash via Emergent LLM key)

## Architecture
- **Frontend**: React 19 + Shadcn UI + Framer Motion + TailwindCSS
- **Backend**: FastAPI + Motor (MongoDB async) + PyJWT
- **AI**: Gemini 3 Flash via emergentintegrations library
- **Database**: MongoDB

## What's Been Implemented (Feb 12, 2026)
### Phase 1 - MVP
1. Full authentication system (JWT)
2. Dashboard with real-time analytics and charts
3. Knowledge Base CRUD (URL fetching, PDF parsing)
4. Widget Configurator with live preview
5. Conversation viewer
6. Lead management table
7. Account settings
8. Theme toggle (light/dark)
9. Responsive design

### Phase 2 - Team & Admin (Added)
1. **widget.js** - Embeddable chat widget script for external websites
2. **Team Management** - Invite members, assign roles, manage access
3. **Admin Settings** - Organization info, notifications, AI configuration
4. Role-based access control (Owner, Admin, Member, Viewer)

## Widget Integration
```html
<!-- Add before </body> on your website -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://YOUR_APP_URL/widget.js';
    s.dataset.widgetKey = 'YOUR_WIDGET_KEY';
    document.body.appendChild(s);
  })();
</script>
```

## AI Configuration
- **Default Model**: Gemini 3 Flash (gemini-3-flash-preview)
- **Provider**: Google via Emergent LLM Key
- **Costs**: €0.10/1M input tokens, €0.40/1M output tokens
- **~€0.0002 per conversation** (500 tokens avg)

## P0 Features (Next Phase)
- [ ] WhatsApp integration
- [ ] Email notifications for new leads (SMTP)
- [ ] Export leads to CSV

## P1 Features
- [ ] Multi-language AI responses
- [ ] Advanced analytics (conversion tracking)
- [ ] Human handover feature
- [ ] CRM integrations (Salesforce, HubSpot)

## P2 Features
- [ ] A/B testing for welcome messages
- [ ] Custom AI fine-tuning
- [ ] White-label option
- [ ] Billing/Subscription management
