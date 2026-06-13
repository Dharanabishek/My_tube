# MyTube - YouTube Look-Alike Platform

## Overview

MyTube is a full-stack video streaming platform inspired by YouTube. The project provides video playback, user authentication, comments, subscriptions, video downloads, premium plans, and real-time communication features.

The application is built using modern web technologies and follows a client-server architecture with separate frontend and backend modules.

---

## Features

### Video Management

* Upload and stream videos
* Video feed and recommendations
* Custom video player
* Video views and likes tracking
* Watch History
* Watch Later playlist

### User Authentication

* Google Authentication using Firebase
* OTP Verification
* JWT-based authorization
* User profile management

### Comment System

* Add comments on videos
* Like and dislike comments
* Automatic deletion after reaching dislike threshold
* Comment translation support
* Special character filtering for moderation

### Download System

* Download videos directly from the platform
* Downloads section in user profile
* Download history tracking
* Free user limit: 1 download per day
* Premium users: Unlimited downloads

### Subscription Plans

* Free Plan
* Bronze Plan
* Silver Plan
* Gold Plan
* Razorpay test payment integration

### Smart Features

* Dynamic theme switching based on time and region
* Region-based authentication workflow
* Personalized user experience

### Communication Features

* VoIP video calling
* Screen sharing support
* Real-time communication functionality

---

## Technology Stack

### Frontend

* Next.js
* React.js
* Tailwind CSS
* Axios
* Firebase Authentication

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### Payment Gateway

* Razorpay (Test Mode)

### Additional Services

* Firebase
* Translation API
* WebRTC (VoIP & Screen Sharing)

---

## Project Structure

```text
My_tube/
│
├── mytube/                 # Frontend
│   ├── pages/
│   ├── src/
│       ├── components/
|       ├── lib/
|       |── pages/
│       └── styles/
│
├── server/                 # Backend
│   ├── controllers/
|   ├── emailTemplates/
│   ├── filehelper/
│   ├── middleware/
│   ├── Modals/
|   ├── node_modules/
|   ├── routes/
|   ├── services/
│   ├── uploads/
│   └── utils/
│
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Dharanabishek/My_tube.git
cd My_tube
```

### Backend Setup

```bash
cd server
npm install
npm start
```

### Frontend Setup

```bash
cd mytube
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the server directory:

```env
PORT=5000

DB_URL=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

RZP_KEY_ID=your_razorpay_key

RZP_KEY_SECRET=your_razorpay_secret
```

---

## Future Enhancements

* AI-based video recommendations
* Live streaming support
* Advanced analytics dashboard
* Video monetization system
* Creator studio
* Multi-language interface

---


