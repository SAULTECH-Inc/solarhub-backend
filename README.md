# ☀️ SolarHub Backend — NestJS API

Nigeria's Smart Solar Marketplace — complete backend with real-time WebSocket chat, AI advisor, multi-currency payments, and full ecommerce.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 10 (TypeScript) |
| **Database** | PostgreSQL 15 + TypeORM |
| **Cache / Queue** | Redis 7 + Bull queues |
| **Auth** | JWT (access + refresh) + Google OAuth 2.0 |
| **Real-time** | Socket.io WebSocket gateway |
| **AI** | Anthropic Claude (primary) + OpenAI GPT-4o-mini (fallback) |
| **Payments** | Paystack (NGN, USD, GHS) + Stripe (USD, CNY) |
| **Email** | Nodemailer + Handlebars templates + Bull queue |
| **Storage** | Cloudinary + sharp image optimization |
| **API Docs** | Swagger / OpenAPI |

---

## Prerequisites

```bash
node >= 20
pnpm / npm >= 9
PostgreSQL >= 15
Redis >= 7
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/solarhub-backend
cd solarhub-backend
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Fill in all values — especially DB, Redis, JWT secrets, and API keys
```

### 3. Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE solarhub;"

# Run migrations (auto-sync is OFF in production)
npm run migration:run

# Or for development, set DB_SYNC=true in .env to auto-sync entities
```

### 4. Start

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start
```

API available at: `http://localhost:3001/api/v1`  
Swagger docs: `http://localhost:3001/docs`

---

## Module Architecture

```
src/
├── config/
│   └── app.config.ts          # All 11 config namespaces
├── common/
│   ├── decorators/            # @CurrentUser, @Auth, @Roles, @Public
│   ├── filters/               # HttpExceptionFilter
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── interceptors/          # TransformInterceptor, LoggingInterceptor
│   └── utils/                 # pagination, currency, ID generators
└── modules/
    ├── redis/                 # Global Redis service (KV, sessions, OTP, pub/sub)
    ├── auth/                  # JWT, Google OAuth 2.0, refresh tokens
    │   └── strategies/        # jwt, google, local
    ├── users/                 # Profile, address book, seller onboarding
    ├── categories/            # Auto-seeded solar categories with spec schemas
    ├── products/              # Listings, search, AI label scan, stock
    ├── uploads/               # Cloudinary + AI spec extraction (Claude Vision)
    ├── cart/                  # DB cart with guest-to-user merge
    ├── orders/                # Multi-seller orders, state machine
    ├── payments/              # Paystack + Stripe, webhooks, refunds
    ├── delivery/              # Event-sourced tracking timeline
    ├── chat/                  # WebSocket gateway + Claude AI + human agents
    ├── advisor/               # 3-system solar calculator (Claude Sonnet)
    ├── notifications/         # Bull email queue + 8 Handlebars templates
    ├── reviews/               # Ratings, seller replies, helpful count
    ├── favourites/            # Save/toggle products
    └── admin/                 # Dashboard, moderation, health, cron jobs
```

---

## API Reference

All endpoints prefixed with `/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (sends OTP) |
| POST | `/auth/verify-email` | Verify email with OTP |
| POST | `/auth/resend-otp` | Resend verification OTP |
| POST | `/auth/login` | Login → access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/google` | Initiate Google OAuth |
| GET  | `/auth/google/callback` | Google OAuth callback |
| POST | `/auth/forgot-password` | Send reset link |
| POST | `/auth/reset-password` | Reset with token |
| PATCH| `/auth/change-password` | Change password (auth) |
| POST | `/auth/logout` | Invalidate session |
| GET  | `/auth/me` | Current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/products` | Search with filters |
| GET  | `/products/featured` | Featured listings |
| GET  | `/products/:id` | Product detail |
| POST | `/products` | Create listing (seller) |
| PATCH| `/products/:id` | Update listing |
| DELETE| `/products/:id` | Soft delete |
| POST | `/products/:id/upload-image` | Upload product image |
| POST | `/products/scan-label` | AI spec extraction from image |
| GET  | `/products/seller/my-products` | Seller's own listings |
| PATCH| `/products/:id/approve` | Approve (admin) |

### Cart & Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/cart` | Get cart |
| POST | `/cart/items` | Add item |
| PATCH| `/cart/items/:id` | Update quantity |
| DELETE| `/cart/items/:id` | Remove item |
| DELETE| `/cart` | Clear cart |
| POST | `/cart/merge` | Merge guest cart on login |
| POST | `/orders` | Place order from cart |
| GET  | `/orders/my` | Buyer's orders |
| GET  | `/orders/:id` | Order detail |
| PATCH| `/orders/:id/advance` | Advance status (seller/admin) |
| PATCH| `/orders/:id/cancel` | Cancel order |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initiate` | Start Paystack or Stripe payment |
| GET  | `/payments/verify/paystack/:ref` | Verify Paystack payment |
| POST | `/payments/webhook/paystack` | Paystack webhook |
| POST | `/payments/webhook/stripe` | Stripe webhook |
| POST | `/payments/:id/refund` | Refund payment |

### Advisor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/advisor/calculate` | Generate 3 solar system recommendations |
| GET  | `/advisor/sessions` | User's saved sessions |
| PATCH| `/advisor/sessions/:id/select` | Save chosen recommendation |

### Chat (REST)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/rooms` | Create support room |
| GET  | `/chat/rooms` | My rooms |
| GET  | `/chat/rooms/:id/messages` | Message history |
| PATCH| `/chat/rooms/:id/close` | Close/resolve room |
| GET  | `/chat/agent/queue` | Agent queue (admin) |

---

## WebSocket Events

Connect to `ws://localhost:3001/chat`

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId }` | Join a chat room |
| `leave_room` | `{ roomId }` | Leave a room |
| `send_message` | `{ content, roomId?, type?, productId? }` | Send message (AI or human) |
| `request_human` | `{ roomId }` | Escalate to human agent |
| `agent_send` | `{ roomId, content }` | Agent sends reply |
| `typing` | `{ roomId, isTyping }` | Typing indicator |
| `close_room` | `{ roomId }` | Resolve conversation |
| `check_online` | `{ userId }` | Check user online status |

**Server → Client:**
| Event | Description |
|-------|-------------|
| `connected` | Auth confirmed, socket info |
| `room_created` | New room ID after first message |
| `room_history` | Message history on join |
| `new_message` | Incoming message |
| `agent_typing` | AI/agent typing indicator |
| `user_typing` | Customer typing indicator |
| `human_agent_joined` | Agent joined the conversation |
| `queued` | Added to human agent queue |
| `new_chat_assigned` | Agent notified of new room |
| `room_closed` | Room resolved |
| `online_status` | User online/offline status |

---

## Payment Currencies

| Currency | Gateway | Notes |
|----------|---------|-------|
| NGN (₦) | Paystack | Primary — Nigerian Naira |
| USD ($)  | Paystack or Stripe | Both supported |
| GHS (₵)  | Paystack | Ghanaian Cedi |
| CNY (¥)  | Stripe | Chinese Yuan |

The system automatically routes to Paystack for NGN/GHS and Stripe for CNY.

---

## Webhook Setup

### Paystack
1. Dashboard → Settings → API Keys & Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook/paystack`
3. Copy webhook secret → `PAYSTACK_WEBHOOK_SECRET`

### Stripe
```bash
stripe listen --forward-to localhost:3001/api/v1/payments/webhook/stripe
# Copy webhook secret → STRIPE_WEBHOOK_SECRET
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:3001/api/v1/auth/google/callback`
4. Copy Client ID and Secret to `.env`

---

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: solarhub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/modules/notifications/templates ./dist/modules/notifications/templates
EXPOSE 3001
CMD ["node", "dist/main"]
```

---

## Environment Variables Reference

See `.env.example` for the full list. Required variables:

```
# Core
PORT, NODE_ENV, FRONTEND_URL, ALLOWED_ORIGINS

# Database
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# Redis
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

# JWT (use strong random strings, min 32 chars each)
JWT_SECRET, JWT_REFRESH_SECRET

# Google OAuth
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

# AI
ANTHROPIC_API_KEY (required), OPENAI_API_KEY (optional fallback)

# Email
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# Payments (use at least one)
PAYSTACK_SECRET_KEY, STRIPE_SECRET_KEY

# Storage
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

---

## Development Notes

- **DB_SYNC=true** in `.env` will auto-sync entities (dev only, never production)
- Swagger UI available at `/docs` in non-production environments
- Email queue uses Bull — emails are processed asynchronously
- Redis is **required** for sessions, OTP, rate limiting, and chat presence
- The Chat WebSocket gateway auto-falls back to OpenAI if Claude is unavailable

---

## License

Private — SolarHub Nigeria Ltd.
