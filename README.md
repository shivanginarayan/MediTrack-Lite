# MediTrack Lite - Full Stack Application

A complete clinic inventory management system with React frontend and Node.js backend.

## 🏗️ Project Structure

```
meditrack-lite/
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/            # Node.js + Express + Prisma backend
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Frontend Setup

```bash
# In a new terminal
cd frontend  # (or root directory for frontend files)
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔗 Integration

The frontend is configured to connect to the backend API. Update your frontend `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=false
```

## 🧪 Demo Credentials

- **Admin**: `admin@meditrack-demo.com` / `demo123`
- **Lead**: `lead@meditrack-demo.com` / `demo123`
- **Staff**: `staff@meditrack-demo.com` / `demo123`

## 📚 Documentation

- [Backend Documentation](./backend/README.md) - API endpoints, database setup, deployment
- [Frontend Documentation](./README-frontend.md) - Component library, state management, PWA features

## 🌟 Features

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui components
- PWA with offline support
- i18n (English/Spanish)
- Zustand state management
- Responsive design

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with SQLite/PostgreSQL
- JWT authentication
- Role-based access control
- Rate limiting & security
- Comprehensive API endpoints

## 🚀 Deployment

### Backend
- Deploy to Vercel, Railway, or Heroku
- Set up PostgreSQL database
- Configure environment variables

### Frontend
- Deploy to Vercel, Netlify, or similar
- Update API URL in environment variables

## 📝 License

MIT License - see LICENSE file for details
