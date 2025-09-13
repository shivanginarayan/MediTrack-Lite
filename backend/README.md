# MediTrack Lite Backend

Node.js/Express backend API for MediTrack Lite clinic inventory management system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration (the defaults work for development)

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed with demo data
npx prisma db seed
```

### Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials
- **Admin**: `admin@meditrack-demo.com` / `demo123`
- **Lead**: `lead@meditrack-demo.com` / `demo123`
- **Staff**: `staff@meditrack-demo.com` / `demo123`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `GET /api/auth/profile` | Get user profile |
| `GET /api/inventory` | List inventory items |
| `POST /api/inventory` | Create new item |
| `GET /api/alerts` | List alerts |
| `POST /api/alerts/rules` | Create alert rule |
| `GET /api/messages` | List messages |
| `POST /api/messages` | Send broadcast |
| `GET /api/settings/clinic` | Get clinic settings |
| `GET /api/health` | Health check |

## 🗄️ Database

- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Migrations**: `prisma/migrations/`
- **Schema**: `prisma/schema.prisma`

### Database Commands

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── utils/          # Utility functions
│   ├── database/       # Database client
│   └── server.ts       # Main server file
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Database migrations
│   └── seed.ts        # Demo data seeder
├── package.json
└── tsconfig.json
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## 🌐 Frontend Integration

This backend is designed to work with the MediTrack Lite React frontend. Update your frontend's API configuration:

```typescript
// In your frontend .env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=false
```

## 🚀 Deployment

The backend can be deployed to:
- **Vercel** (recommended for Node.js)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

For production deployment:
1. Set up a PostgreSQL database
2. Update `DATABASE_URL` in environment variables
3. Run `npx prisma migrate deploy`
4. Deploy the application

## 🔐 Security Features

- JWT authentication with refresh tokens
- Rate limiting
- CORS protection
- Input validation with Joi
- SQL injection protection (Prisma)
- Password hashing with bcrypt
- Role-based access control

## 📝 License

MIT License - see LICENSE file for details