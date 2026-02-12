# SalesGenius - AI Sales Assistant SaaS Platform

## Problem Statement
Build an AI-powered Digital Sales Assistant SaaS platform inspired by AutoCust (with different branding). Transform websites into interactive shopping experiences through an AI chatbot widget.

## User Personas
1. **Business Admin**: Manages AI assistant, uploads knowledge base, customizes widget
2. **Website Visitor**: Interacts with the chat widget to get product info and support

## Core Requirements (MVP - Implemented)
- [x] Landing page with marketing content
- [x] JWT-based authentication (register/login)
- [x] Admin Dashboard with analytics
- [x] Knowledge Base management (URL + PDF upload)
- [x] Widget Configurator with live preview
- [x] Conversation logs viewer
- [x] Lead management
- [x] Settings page
- [x] Light/Dark theme support
- [x] AI Chat (Gemini 3 Flash via Emergent LLM key)

## Architecture
- **Frontend**: React 19 + Shadcn UI + Framer Motion + TailwindCSS
- **Backend**: FastAPI + Motor (MongoDB async) + PyJWT
- **AI**: Gemini 3 Flash via emergentintegrations library
- **Database**: MongoDB

## What's Been Implemented (Feb 12, 2026)
1. Full authentication system (JWT)
2. Dashboard with real-time analytics and charts
3. Knowledge Base CRUD (URL fetching, PDF parsing)
4. Widget Configurator with live preview
5. Conversation viewer
6. Lead management table
7. Account settings
8. Theme toggle (light/dark)
9. Responsive design

## P0 Features (Next Phase)
- [ ] Embeddable chat widget script (widget.js)
- [ ] WhatsApp integration
- [ ] Email notifications for new leads

## P1 Features
- [ ] Multi-language support
- [ ] Advanced analytics (conversion tracking)
- [ ] Human handover feature
- [ ] CRM integrations

## P2 Features
- [ ] A/B testing for welcome messages
- [ ] Custom AI fine-tuning
- [ ] White-label option

## Cost Model (Gemini 3 Flash)
- Input: €0.10/1M tokens
- Output: €0.40/1M tokens
- ~€0.0002 per conversation (500 tokens avg)
