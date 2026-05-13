# Voting App

A React + Vite application for voting on meeting destinations, integrated with Firebase.

## Features
- Public voting page with real-time results.
- Admin dashboard for managing destinations and votes.
- Firebase Firestore for data storage.
- Firebase Storage for image uploads.
- CSV export for votes.

## Setup Instructions

### 1. Prerequisites
- Node.js installed.
- A Firebase project created.

### 2. Firebase Configuration
- Enable **Firestore Database** and **Storage** in your Firebase console.
- Copy `.env.example` to `.env`.
- Fill in your Firebase configuration keys in `.env`.

### 3. Installation
```bash
npm install
```

### 4. Running Locally
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Admin Access
Route to `/admin` to access the admin dashboard.
