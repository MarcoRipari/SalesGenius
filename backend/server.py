from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
import PyPDF2
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'salesgenius_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="SalesGenius API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    company_name: str
    created_at: str

class KnowledgeSourceCreate(BaseModel):
    type: str  # 'url' or 'pdf'
    name: str
    url: Optional[str] = None
    content: Optional[str] = None

class KnowledgeSourceResponse(BaseModel):
    id: str
    user_id: str
    type: str
    name: str
    url: Optional[str] = None
    content_preview: Optional[str] = None
    status: str
    created_at: str

class WidgetConfigUpdate(BaseModel):
    bot_name: str = "SalesGenius"
    welcome_message: str = "Ciao! Come posso aiutarti oggi?"
    primary_color: str = "#F97316"
    position: str = "bottom-right"
    avatar_url: Optional[str] = None

class WidgetConfigResponse(BaseModel):
    id: str
    user_id: str
    bot_name: str
    welcome_message: str
    primary_color: str
    position: str
    avatar_url: Optional[str]
    updated_at: str

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    widget_key: str  # User's widget key for identification

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    timestamp: str

class ConversationResponse(BaseModel):
    id: str
    session_id: str
    visitor_id: str
    messages_count: int
    started_at: str
    last_message_at: str

class LeadCreate(BaseModel):
    session_id: str
    widget_key: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class AnalyticsOverview(BaseModel):
    total_conversations: int
    total_messages: int
    total_leads: int
    conversations_today: int
    avg_messages_per_conversation: float


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    user_id = str(uuid.uuid4())
    widget_key = str(uuid.uuid4())[:8]  # Short key for widget identification
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "company_name": user.company_name,
        "widget_key": widget_key,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create default widget config
    widget_config = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "bot_name": "SalesGenius",
        "welcome_message": "Ciao! Come posso aiutarti oggi?",
        "primary_color": "#F97316",
        "position": "bottom-right",
        "avatar_url": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.widget_configs.insert_one(widget_config)
    
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": user.email, "company_name": user.company_name, "widget_key": widget_key}}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    token = create_token(db_user["id"])
    return {
        "token": token, 
        "user": {
            "id": db_user["id"], 
            "email": db_user["email"], 
            "company_name": db_user["company_name"],
            "widget_key": db_user["widget_key"]
        }
    }

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "company_name": user["company_name"],
        "widget_key": user["widget_key"]
    }


# ==================== KNOWLEDGE BASE ROUTES ====================

@api_router.get("/knowledge", response_model=List[KnowledgeSourceResponse])
async def get_knowledge_sources(user = Depends(get_current_user)):
    sources = await db.knowledge_sources.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return sources

@api_router.post("/knowledge/url")
async def add_url_source(source: KnowledgeSourceCreate, user = Depends(get_current_user)):
    if not source.url:
        raise HTTPException(status_code=400, detail="URL richiesto")
    
    # Fetch URL content
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(source.url, timeout=30.0)
            content = response.text[:10000]  # Limit content
    except Exception as e:
        logger.error(f"Error fetching URL: {e}")
        content = ""
    
    source_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "url",
        "name": source.name,
        "url": source.url,
        "content": content,
        "content_preview": content[:200] if content else None,
        "status": "active" if content else "error",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.knowledge_sources.insert_one(source_doc)
    
    return {"id": source_doc["id"], "status": source_doc["status"], "message": "Fonte aggiunta con successo"}

@api_router.post("/knowledge/pdf")
async def add_pdf_source(
    file: UploadFile = File(...),
    name: str = Form(...),
    user = Depends(get_current_user)
):
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text_content = ""
        for page in pdf_reader.pages[:20]:  # Limit pages
            text_content += page.extract_text() or ""
        text_content = text_content[:15000]  # Limit content
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        raise HTTPException(status_code=400, detail="Errore nella lettura del PDF")
    
    source_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "pdf",
        "name": name,
        "url": None,
        "content": text_content,
        "content_preview": text_content[:200] if text_content else None,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.knowledge_sources.insert_one(source_doc)
    
    return {"id": source_doc["id"], "status": "active", "message": "PDF caricato con successo"}

@api_router.delete("/knowledge/{source_id}")
async def delete_knowledge_source(source_id: str, user = Depends(get_current_user)):
    result = await db.knowledge_sources.delete_one({"id": source_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fonte non trovata")
    return {"message": "Fonte eliminata"}


# ==================== WIDGET CONFIG ROUTES ====================

@api_router.get("/widget/config")
async def get_widget_config(user = Depends(get_current_user)):
    config = await db.widget_configs.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Configurazione non trovata")
    return config

@api_router.put("/widget/config")
async def update_widget_config(config: WidgetConfigUpdate, user = Depends(get_current_user)):
    update_doc = {
        **config.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.widget_configs.update_one(
        {"user_id": user["id"]},
        {"$set": update_doc}
    )
    return {"message": "Configurazione aggiornata"}

@api_router.get("/widget/public/{widget_key}")
async def get_public_widget_config(widget_key: str):
    user = await db.users.find_one({"widget_key": widget_key}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Widget non trovato")
    
    config = await db.widget_configs.find_one({"user_id": user["id"]}, {"_id": 0, "user_id": 0})
    return config


# ==================== CHAT ROUTES ====================

@api_router.post("/chat/message")
async def send_chat_message(req: ChatMessageRequest):
    # Validate widget key
    user = await db.users.find_one({"widget_key": req.widget_key}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Widget non valido")
    
    # Get or create conversation
    conversation = await db.conversations.find_one({"session_id": req.session_id}, {"_id": 0})
    if not conversation:
        conversation = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_id": req.session_id,
            "visitor_id": str(uuid.uuid4())[:8],
            "messages_count": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }
        await db.conversations.insert_one(conversation)
    
    # Save user message
    user_msg_id = str(uuid.uuid4())
    user_msg = {
        "id": user_msg_id,
        "conversation_id": conversation["id"],
        "session_id": req.session_id,
        "role": "user",
        "content": req.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(user_msg)
    
    # Get knowledge base content
    sources = await db.knowledge_sources.find({"user_id": user["id"], "status": "active"}, {"_id": 0}).to_list(50)
    knowledge_context = "\n\n".join([s.get("content", "")[:2000] for s in sources if s.get("content")])
    
    # Get widget config for bot personality
    widget_config = await db.widget_configs.find_one({"user_id": user["id"]}, {"_id": 0})
    bot_name = widget_config.get("bot_name", "SalesGenius") if widget_config else "SalesGenius"
    
    # Generate AI response
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        system_message = f"""Sei {bot_name}, un assistente vendite AI professionale e amichevole per {user.get('company_name', 'un\'azienda')}.
Il tuo obiettivo è aiutare i visitatori a trovare prodotti/servizi e rispondere alle loro domande.
Rispondi sempre in italiano, in modo conciso e utile.
Se non conosci la risposta, suggerisci di contattare l'azienda direttamente.

CONOSCENZE AZIENDALI:
{knowledge_context[:3000] if knowledge_context else 'Nessuna informazione specifica disponibile.'}
"""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=req.session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=req.message)
        ai_response = await chat.send_message(user_message)
        
    except Exception as e:
        logger.error(f"AI Error: {e}")
        ai_response = "Mi scuso, ma al momento non riesco a rispondere. Per favore riprova più tardi o contatta direttamente l'azienda."
    
    # Save AI response
    ai_msg_id = str(uuid.uuid4())
    ai_msg = {
        "id": ai_msg_id,
        "conversation_id": conversation["id"],
        "session_id": req.session_id,
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(ai_msg)
    
    # Update conversation
    await db.conversations.update_one(
        {"session_id": req.session_id},
        {"$set": {"last_message_at": datetime.now(timezone.utc).isoformat()}, "$inc": {"messages_count": 2}}
    )
    
    return {
        "id": ai_msg_id,
        "session_id": req.session_id,
        "role": "assistant",
        "content": ai_response,
        "timestamp": ai_msg["timestamp"]
    }

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(100)
    return messages


# ==================== CONVERSATIONS ROUTES ====================

@api_router.get("/conversations")
async def get_conversations(user = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    return conversations

@api_router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, user = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id, "user_id": user["id"]}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversazione non trovata")
    
    messages = await db.messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(200)
    return {"conversation": conversation, "messages": messages}


# ==================== LEADS ROUTES ====================

@api_router.post("/leads")
async def create_lead(lead: LeadCreate):
    user = await db.users.find_one({"widget_key": lead.widget_key}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Widget non valido")
    
    lead_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": lead.session_id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(lead_doc)
    return {"message": "Lead salvato", "id": lead_doc["id"]}

@api_router.get("/leads")
async def get_leads(user = Depends(get_current_user)):
    leads = await db.leads.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leads


# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/overview")
async def get_analytics_overview(user = Depends(get_current_user)):
    user_id = user["id"]
    
    total_conversations = await db.conversations.count_documents({"user_id": user_id})
    total_messages = await db.messages.count_documents({"conversation_id": {"$in": [
        c["id"] async for c in db.conversations.find({"user_id": user_id}, {"id": 1})
    ]}})
    total_leads = await db.leads.count_documents({"user_id": user_id})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    conversations_today = await db.conversations.count_documents({
        "user_id": user_id,
        "started_at": {"$gte": today_start}
    })
    
    avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_leads": total_leads,
        "conversations_today": conversations_today,
        "avg_messages_per_conversation": round(avg_messages, 1)
    }

@api_router.get("/analytics/daily")
async def get_daily_analytics(user = Depends(get_current_user)):
    # Get last 7 days stats
    daily_stats = []
    for i in range(7):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = date.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()
        
        count = await db.conversations.count_documents({
            "user_id": user["id"],
            "started_at": {"$gte": day_start, "$lte": day_end}
        })
        daily_stats.append({
            "date": date.strftime("%d/%m"),
            "conversations": count
        })
    
    return list(reversed(daily_stats))


# ==================== COST ESTIMATION ====================

@api_router.get("/pricing/estimate")
async def get_pricing_estimate():
    """Returns estimated costs for Gemini 3 Flash"""
    return {
        "model": "Gemini 3 Flash",
        "input_cost_per_million": 0.10,
        "output_cost_per_million": 0.40,
        "avg_conversation_tokens": 500,
        "estimated_cost_per_conversation": 0.0002,
        "example_costs": {
            "100_conversations": 0.02,
            "1000_conversations": 0.20,
            "10000_conversations": 2.00
        }
    }


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
