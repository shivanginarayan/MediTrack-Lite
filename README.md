# MediTrack Lite 💊

A modern, full-stack medication tracking and inventory management system built with React, TypeScript, and Node.js.

## 🤖 AI-Assisted Development

This project was created with the assistance of AI technology, demonstrating the power of human-AI collaboration in modern software development. The AI helped with:
- Architecture design and implementation
- Code generation and optimization
- Bug fixes and feature enhancements
- Documentation and best practices

## 📋 What This Project Does

MediTrack Lite is a comprehensive medication management system designed for healthcare facilities, pharmacies, or personal use. It provides:

### 🎯 Core Features
- **Dashboard Overview**: Real-time statistics and alerts for medication inventory
- **Inventory Management**: Add, edit, delete, and track medications with detailed information
- **Smart Filtering**: Filter medications by status (in-stock, low-stock, expiring soon)
- **Expiration Alerts**: Automatic notifications for medications nearing expiration
- **Low Stock Warnings**: Alerts when medication quantities fall below minimum levels
- **AI Assistant**: Integrated AI chat assistant for medication-related queries
- **User Authentication**: Secure login system with demo credentials
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **PWA Support**: Progressive Web App capabilities for offline access

### 🛠️ Technical Features
- **Modern React Frontend**: Built with React 18, TypeScript, and Vite
- **Tailwind CSS Styling**: Beautiful, responsive UI with modern design
- **Node.js Backend**: RESTful API with Express.js
- **SQLite Database**: Lightweight database with Prisma ORM
- **Real-time Updates**: Live data synchronization
- **State Management**: Zustand for efficient state handling
- **Internationalization**: Multi-language support (English/Spanish)

## 🚀 How to Download and Run

### Prerequisites
Make sure you have the following installed on your computer:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/shivanginarayan/MediTrack-Lite.git
cd MediTrack-Lite
```

### Step 2: Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 3: Set Up Environment Variables

#### Frontend Environment
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3000
```

#### Backend Environment
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Step 4: Initialize the Database
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

### Step 5: Start the Application

#### Option A: Start Both Frontend and Backend Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

#### Option B: Start Both with One Command (if available)
```bash
npm run dev:all
```

### Step 6: Access the Application

- **Frontend**: Open your browser and go to `http://localhost:5173`
- **Backend API**: Available at `http://localhost:3000`

### 🔐 Demo Login Credentials
```
Email: demo@meditrack.com
Password: demo123
```

## 📱 Usage Guide

1. **Login**: Use the demo credentials or create a new account
2. **Dashboard**: View overview statistics and alerts
3. **Inventory**: Manage your medication inventory
   - Click "Add Medication" to add new items
   - Use filters to find specific medications
   - Click on cards to filter by status
4. **Alerts**: Monitor expiring medications and low stock items
5. **AI Assistant**: Ask questions about medications and get helpful responses
6. **Settings**: Customize your preferences and language

## 🛠️ Development

### Project Structure
```
MediTrack-Lite/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── stores/            # State management
│   ├── lib/               # Utilities and helpers
│   └── styles/            # CSS and styling
├── backend/               # Backend source code
│   ├── src/               # Server source code
│   ├── prisma/            # Database schema and migrations
│   └── routes/            # API routes
└── public/                # Static assets
```

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server

## 🌟 Features in Detail

### Dashboard
- Real-time medication statistics
- Quick access to critical alerts
- Visual indicators for inventory status

### Inventory Management
- Comprehensive medication database
- Batch operations for efficiency
- Advanced search and filtering
- Expiration date tracking

### AI Assistant
- Natural language queries
- Medication information lookup
- Dosage and interaction guidance
- Demo mode with realistic responses

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with the assistance of AI technology
- Inspired by modern healthcare management needs
- Thanks to the open-source community for the amazing tools and libraries

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

---

**Made with ❤️ and AI assistance**