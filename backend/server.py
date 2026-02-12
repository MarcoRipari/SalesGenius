from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
import PyPDF2
import io
import re
import json
from bs4 import BeautifulSoup

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

# Team Management Models
class TeamMemberInvite(BaseModel):
    email: EmailStr
    role: str = "member"  # admin, member, viewer

class TeamMemberUpdate(BaseModel):
    role: str

class TeamMemberResponse(BaseModel):
    id: str
    email: str
    role: str
    status: str  # pending, active
    invited_at: str
    joined_at: Optional[str] = None

# Admin Settings Models
class AdminSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    support_email: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    notification_new_lead: Optional[bool] = None
    notification_new_conversation: Optional[bool] = None
    ai_model: Optional[str] = None
    max_tokens_per_response: Optional[int] = None

# Product Models
class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    price_value: Optional[float] = None
    image_url: Optional[str] = None
    product_url: str
    category: Optional[str] = None
    in_stock: bool = True

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


# ==================== PRODUCT SCRAPING HELPERS ====================

async def extract_products_from_url(url: str, source_id: str, user_id: str) -> List[Dict]:
    """Extract product information from a URL using various strategies"""
    products = []
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            base_url = '/'.join(url.split('/')[:3])
            
            # Strategy 1: Look for JSON-LD structured data
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, list):
                        for item in data:
                            if item.get('@type') == 'Product':
                                products.append(parse_jsonld_product(item, url, source_id, user_id, base_url))
                    elif data.get('@type') == 'Product':
                        products.append(parse_jsonld_product(data, url, source_id, user_id, base_url))
                    elif data.get('@type') == 'ItemList':
                        for item in data.get('itemListElement', []):
                            if item.get('@type') == 'Product' or item.get('item', {}).get('@type') == 'Product':
                                prod = item if item.get('@type') == 'Product' else item.get('item', {})
                                products.append(parse_jsonld_product(prod, url, source_id, user_id, base_url))
                except:
                    pass
            
            # Strategy 2: Look for common e-commerce product patterns
            if not products:
                # WooCommerce, Shopify, generic patterns
                product_selectors = [
                    '.product', '.product-item', '.product-card', 
                    '[data-product]', '.woocommerce-loop-product',
                    '.product-grid-item', '.collection-product',
                    'article.product', '.products li'
                ]
                
                for selector in product_selectors:
                    items = soup.select(selector)
                    for item in items[:50]:  # Limit to 50 products per page
                        product = extract_product_from_element(item, base_url, source_id, user_id)
                        if product and product.get('name'):
                            products.append(product)
                    if products:
                        break
            
            # Strategy 3: Look for individual product page
            if not products:
                product = extract_single_product(soup, url, source_id, user_id, base_url)
                if product and product.get('name'):
                    products.append(product)
            
    except Exception as e:
        logger.error(f"Error extracting products from {url}: {e}")
    
    return products

def parse_jsonld_product(data: Dict, page_url: str, source_id: str, user_id: str, base_url: str) -> Dict:
    """Parse JSON-LD product data"""
    price = None
    price_value = None
    
    offers = data.get('offers', {})
    if isinstance(offers, list) and offers:
        offers = offers[0]
    if offers:
        price = offers.get('price')
        price_value = float(price) if price else None
        currency = offers.get('priceCurrency', '€')
        if price:
            price = f"{currency} {price}"
    
    image = data.get('image')
    if isinstance(image, list):
        image = image[0] if image else None
    if isinstance(image, dict):
        image = image.get('url')
    if image and not image.startswith('http'):
        image = base_url + image if image.startswith('/') else base_url + '/' + image
    
    product_url = data.get('url', page_url)
    if product_url and not product_url.startswith('http'):
        product_url = base_url + product_url if product_url.startswith('/') else base_url + '/' + product_url
    
    return {
        "id": str(uuid.uuid4()),
        "source_id": source_id,
        "user_id": user_id,
        "name": data.get('name', ''),
        "description": data.get('description', '')[:500] if data.get('description') else None,
        "price": price,
        "price_value": price_value,
        "image_url": image,
        "product_url": product_url,
        "category": data.get('category'),
        "brand": data.get('brand', {}).get('name') if isinstance(data.get('brand'), dict) else data.get('brand'),
        "sku": data.get('sku'),
        "in_stock": offers.get('availability', '').lower().find('instock') != -1 if offers else True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

def extract_product_from_element(element, base_url: str, source_id: str, user_id: str) -> Dict:
    """Extract product from HTML element"""
    product = {
        "id": str(uuid.uuid4()),
        "source_id": source_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Find name
    name_selectors = ['h2', 'h3', 'h4', '.product-name', '.product-title', '.title', '[class*="title"]', '[class*="name"]', 'a']
    for sel in name_selectors:
        name_el = element.select_one(sel)
        if name_el and name_el.get_text(strip=True):
            product['name'] = name_el.get_text(strip=True)[:200]
            break
    
    # Find image
    img = element.select_one('img')
    if img:
        img_src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if img_src:
            if not img_src.startswith('http'):
                img_src = base_url + img_src if img_src.startswith('/') else base_url + '/' + img_src
            product['image_url'] = img_src
    
    # Find price
    price_selectors = ['.price', '[class*="price"]', '.amount', '.woocommerce-Price-amount']
    for sel in price_selectors:
        price_el = element.select_one(sel)
        if price_el:
            price_text = price_el.get_text(strip=True)
            product['price'] = price_text
            # Extract numeric value
            price_match = re.search(r'[\d,.]+', price_text.replace(',', '.'))
            if price_match:
                try:
                    product['price_value'] = float(price_match.group().replace(',', '.'))
                except:
                    pass
            break
    
    # Find link
    link = element.select_one('a[href]')
    if link:
        href = link.get('href', '')
        if href and not href.startswith('#') and not href.startswith('javascript'):
            if not href.startswith('http'):
                href = base_url + href if href.startswith('/') else base_url + '/' + href
            product['product_url'] = href
    
    product['in_stock'] = True
    return product

def extract_single_product(soup, url: str, source_id: str, user_id: str, base_url: str) -> Dict:
    """Extract single product from a product detail page"""
    product = {
        "id": str(uuid.uuid4()),
        "source_id": source_id,
        "user_id": user_id,
        "product_url": url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Find name from h1 or title
    h1 = soup.select_one('h1')
    if h1:
        product['name'] = h1.get_text(strip=True)[:200]
    else:
        title = soup.select_one('title')
        if title:
            product['name'] = title.get_text(strip=True).split('|')[0].split('-')[0].strip()[:200]
    
    # Find main image
    main_img = soup.select_one('.product-image img, .woocommerce-product-gallery img, [class*="product"] img')
    if main_img:
        img_src = main_img.get('src') or main_img.get('data-src')
        if img_src and not img_src.startswith('http'):
            img_src = base_url + img_src if img_src.startswith('/') else base_url + '/' + img_src
        product['image_url'] = img_src
    
    # Find price
    price_el = soup.select_one('.price, [class*="price"], .woocommerce-Price-amount')
    if price_el:
        product['price'] = price_el.get_text(strip=True)
        price_match = re.search(r'[\d,.]+', product['price'].replace(',', '.'))
        if price_match:
            try:
                product['price_value'] = float(price_match.group().replace(',', '.'))
            except:
                pass
    
    # Find description
    desc_el = soup.select_one('.description, .product-description, [class*="description"]')
    if desc_el:
        product['description'] = desc_el.get_text(strip=True)[:500]
    
    product['in_stock'] = True
    return product

async def search_products(user_id: str, query: str, limit: int = 6) -> List[Dict]:
    """Search products by text query"""
    # Create search regex for each word in the query
    words = query.lower().split()
    search_conditions = []
    
    for word in words:
        if len(word) > 2:  # Skip very short words
            regex = {"$regex": word, "$options": "i"}
            search_conditions.append({
                "$or": [
                    {"name": regex},
                    {"description": regex},
                    {"category": regex},
                    {"brand": regex}
                ]
            })
    
    if not search_conditions:
        return []
    
    # Find products matching all words
    products = await db.products.find(
        {"user_id": user_id, "$and": search_conditions},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # If no exact match, try partial match
    if not products and words:
        products = await db.products.find(
            {"user_id": user_id, "$or": search_conditions},
            {"_id": 0}
        ).limit(limit).to_list(limit)
    
    return products


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
    
    source_id = str(uuid.uuid4())
    source_doc = {
        "id": source_id,
        "user_id": user["id"],
        "type": "url",
        "name": source.name,
        "url": source.url,
        "content": content,
        "content_preview": content[:200] if content else None,
        "status": "active" if content else "error",
        "products_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.knowledge_sources.insert_one(source_doc)
    
    # Extract products in background
    products_count = 0
    try:
        products = await extract_products_from_url(source.url, source_id, user["id"])
        if products:
            await db.products.insert_many(products)
            products_count = len(products)
            await db.knowledge_sources.update_one(
                {"id": source_id},
                {"$set": {"products_count": products_count}}
            )
    except Exception as e:
        logger.error(f"Error extracting products: {e}")
    
    return {
        "id": source_doc["id"], 
        "status": source_doc["status"], 
        "products_count": products_count,
        "message": f"Fonte aggiunta con successo. {products_count} prodotti estratti."
    }

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
    # Also delete associated products
    await db.products.delete_many({"source_id": source_id})
    return {"message": "Fonte eliminata"}


# ==================== PRODUCTS ROUTES ====================

@api_router.get("/products")
async def get_products(user = Depends(get_current_user), limit: int = 50):
    """Get all products for the user"""
    products = await db.products.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).limit(limit).to_list(limit)
    return products

@api_router.get("/products/search")
async def search_products_api(q: str, user = Depends(get_current_user)):
    """Search products by query"""
    products = await search_products(user["id"], q, limit=10)
    return products

@api_router.get("/products/by-source/{source_id}")
async def get_products_by_source(source_id: str, user = Depends(get_current_user)):
    """Get products from a specific knowledge source"""
    products = await db.products.find(
        {"user_id": user["id"], "source_id": source_id}, 
        {"_id": 0}
    ).to_list(100)
    return products

@api_router.post("/products/rescan/{source_id}")
async def rescan_products(source_id: str, user = Depends(get_current_user)):
    """Rescan a URL source for products"""
    source = await db.knowledge_sources.find_one(
        {"id": source_id, "user_id": user["id"], "type": "url"},
        {"_id": 0}
    )
    if not source:
        raise HTTPException(status_code=404, detail="Fonte URL non trovata")
    
    # Delete existing products from this source
    await db.products.delete_many({"source_id": source_id})
    
    # Re-extract products
    products = await extract_products_from_url(source["url"], source_id, user["id"])
    products_count = 0
    if products:
        await db.products.insert_many(products)
        products_count = len(products)
    
    await db.knowledge_sources.update_one(
        {"id": source_id},
        {"$set": {"products_count": products_count}}
    )
    
    return {"message": f"Scansione completata. {products_count} prodotti trovati.", "products_count": products_count}


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
        
        company_name = user.get('company_name', "un'azienda")
        kb_content = knowledge_context[:3000] if knowledge_context else 'Nessuna informazione specifica disponibile.'
        
        system_message = f"""Sei {bot_name}, un assistente vendite AI professionale e amichevole per {company_name}.
Il tuo obiettivo è aiutare i visitatori a trovare prodotti/servizi e rispondere alle loro domande.
Rispondi sempre in italiano, in modo conciso e utile.
Se non conosci la risposta, suggerisci di contattare l'azienda direttamente.

CONOSCENZE AZIENDALI:
{kb_content}
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


# ==================== TEAM MANAGEMENT ROUTES ====================

def check_admin_role(user):
    """Check if user is admin of the organization"""
    role = user.get("role", "admin")  # First user is always admin
    if role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Accesso negato. Solo gli admin possono eseguire questa operazione.")
    return True

@api_router.get("/team/members")
async def get_team_members(user = Depends(get_current_user)):
    """Get all team members for the organization"""
    org_id = user.get("org_id", user["id"])  # Use user id as org_id for first user
    members = await db.team_members.find({"org_id": org_id}, {"_id": 0}).to_list(100)
    
    # Include the owner/creator
    owner = await db.users.find_one({"id": org_id}, {"_id": 0, "password": 0})
    if owner:
        owner_member = {
            "id": owner["id"],
            "email": owner["email"],
            "role": "owner",
            "status": "active",
            "invited_at": owner.get("created_at"),
            "joined_at": owner.get("created_at")
        }
        members.insert(0, owner_member)
    
    return members

@api_router.post("/team/invite")
async def invite_team_member(invite: TeamMemberInvite, user = Depends(get_current_user)):
    """Invite a new team member"""
    check_admin_role(user)
    org_id = user.get("org_id", user["id"])
    
    # Check if already invited or exists
    existing = await db.team_members.find_one({"org_id": org_id, "email": invite.email})
    if existing:
        raise HTTPException(status_code=400, detail="Questo utente è già stato invitato")
    
    # Check if email already registered as user
    existing_user = await db.users.find_one({"email": invite.email})
    
    member_doc = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "email": invite.email,
        "role": invite.role,
        "status": "active" if existing_user else "pending",
        "user_id": existing_user["id"] if existing_user else None,
        "invited_by": user["id"],
        "invited_at": datetime.now(timezone.utc).isoformat(),
        "joined_at": datetime.now(timezone.utc).isoformat() if existing_user else None
    }
    await db.team_members.insert_one(member_doc)
    
    # If user exists, update their org_id
    if existing_user:
        await db.users.update_one({"id": existing_user["id"]}, {"$set": {"org_id": org_id, "role": invite.role}})
    
    return {"message": f"Invito inviato a {invite.email}", "member": {
        "id": member_doc["id"],
        "email": member_doc["email"],
        "role": member_doc["role"],
        "status": member_doc["status"]
    }}

@api_router.put("/team/members/{member_id}")
async def update_team_member(member_id: str, update: TeamMemberUpdate, user = Depends(get_current_user)):
    """Update team member role"""
    check_admin_role(user)
    org_id = user.get("org_id", user["id"])
    
    if update.role not in ["admin", "member", "viewer"]:
        raise HTTPException(status_code=400, detail="Ruolo non valido")
    
    result = await db.team_members.update_one(
        {"id": member_id, "org_id": org_id},
        {"$set": {"role": update.role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Membro non trovato")
    
    # Update user role too if they have a user_id
    member = await db.team_members.find_one({"id": member_id}, {"_id": 0})
    if member and member.get("user_id"):
        await db.users.update_one({"id": member["user_id"]}, {"$set": {"role": update.role}})
    
    return {"message": "Ruolo aggiornato"}

@api_router.delete("/team/members/{member_id}")
async def remove_team_member(member_id: str, user = Depends(get_current_user)):
    """Remove a team member"""
    check_admin_role(user)
    org_id = user.get("org_id", user["id"])
    
    member = await db.team_members.find_one({"id": member_id, "org_id": org_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Membro non trovato")
    
    # Can't remove owner
    if member.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Non puoi rimuovere il proprietario")
    
    await db.team_members.delete_one({"id": member_id, "org_id": org_id})
    
    # Remove org_id from user if exists
    if member.get("user_id"):
        await db.users.update_one({"id": member["user_id"]}, {"$unset": {"org_id": "", "role": ""}})
    
    return {"message": "Membro rimosso"}


# ==================== ADMIN SETTINGS ROUTES ====================

@api_router.get("/admin/settings")
async def get_admin_settings(user = Depends(get_current_user)):
    """Get organization admin settings"""
    org_id = user.get("org_id", user["id"])
    settings = await db.admin_settings.find_one({"org_id": org_id}, {"_id": 0})
    
    if not settings:
        # Return default settings
        user_data = await db.users.find_one({"id": org_id}, {"_id": 0})
        settings = {
            "org_id": org_id,
            "company_name": user_data.get("company_name", ""),
            "company_logo": None,
            "support_email": user_data.get("email", ""),
            "timezone": "Europe/Rome",
            "language": "it",
            "notification_new_lead": True,
            "notification_new_conversation": False,
            "ai_model": "gemini-3-flash-preview",
            "max_tokens_per_response": 500
        }
    
    return settings

@api_router.put("/admin/settings")
async def update_admin_settings(settings: AdminSettingsUpdate, user = Depends(get_current_user)):
    """Update organization admin settings"""
    check_admin_role(user)
    org_id = user.get("org_id", user["id"])
    
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admin_settings.update_one(
        {"org_id": org_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Update company name in users table too
    if settings.company_name:
        await db.users.update_one({"id": org_id}, {"$set": {"company_name": settings.company_name}})
    
    return {"message": "Impostazioni aggiornate"}

@api_router.get("/admin/api-config")
async def get_api_config(user = Depends(get_current_user)):
    """Get AI API configuration info"""
    check_admin_role(user)
    
    # Check if custom API key is set
    has_custom_key = bool(os.environ.get("CUSTOM_LLM_KEY"))
    
    return {
        "current_model": "gemini-3-flash-preview",
        "provider": "Google Gemini",
        "using_emergent_key": not has_custom_key,
        "available_models": [
            {"id": "gemini-3-flash-preview", "name": "Gemini 3 Flash", "cost_input": 0.10, "cost_output": 0.40},
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "cost_input": 0.15, "cost_output": 0.60},
            {"id": "gpt-5.2", "name": "GPT-5.2", "cost_input": 2.50, "cost_output": 10.00}
        ],
        "instructions": {
            "emergent_key": "Stai usando la Emergent LLM Key universale. I costi vengono addebitati al tuo account Emergent.",
            "custom_key": "Per usare una tua API key, contatta il supporto o configura CUSTOM_LLM_KEY nelle variabili d'ambiente."
        }
    }


# ==================== USER PROFILE UPDATE ====================

@api_router.put("/auth/profile")
async def update_profile(
    company_name: Optional[str] = None,
    email: Optional[str] = None,
    user = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if company_name:
        update_data["company_name"] = company_name
    if email:
        # Check if email is already taken
        existing = await db.users.find_one({"email": email, "id": {"$ne": user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email già in uso")
        update_data["email"] = email
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    return {"message": "Profilo aggiornato"}


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
