# 🚗 TrackMate: Nexus Mobility Platform

A premium, full-stack ride-sharing application built with the MERN stack (MongoDB, Express, React, Node.js). Featuring real-time route optimization, secure payments, and a futuristic UI/UX.

## ✨ Features

- **Dynamic Route Optimization**: Leverages Google Maps API with real-time traffic data for accurate distance and ETA estimates.
- **Role-Based Dashboards**: 
  - **Travellers**: Publish rides, manage routes, and view live bookings.
  - **Passengers**: Discover rides near their route and secure bookings via a dedicated authorization portal.
- **Secure Authorization System**: Integrated payment simulation with a live route summary map during checkout.
- **Real-Time Synergy**: Socket.io integration for instant notifications and sync across the mobility grid.
- **Premium Aesthetics**: Built with a "Physical Glass" design system, custom micro-animations (Framer Motion), and responsive layouts.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React, Leaflet (React-Leaflet).
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT Authentication.
- **Mapping**: Google Maps Distance Matrix, Directions, and Geocoding APIs.

## 🚀 Quick Start

### 1. Prerequisite
Ensure you have the following environment variables in your `.env` files:
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_MAPS_API_KEY`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/ZET-Technologies-Private-Limited/TrackMate.git

# Install Backend dependencies
cd backend && npm install

# Install Frontend dependencies
cd ../frontend && npm install
```

### 3. Execution (Development Mode)
```bash
# Run Backend (Auto-reloading with nodemon)
cd backend && npm run dev

# Run Frontend
cd frontend && npm run dev
```

## 🔒 Security
- **JWT Protection**: Secure state-based authentication.
- **Encryption**: PCI-DSS compliant payment simulation architecture.

---
Built with ⚡ by [ZET-Technologies](https://github.com/ZET-Technologies-Private-Limited)
