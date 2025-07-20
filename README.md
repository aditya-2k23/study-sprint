# Study Sprint

A collaborative study platform with real-time video conferencing, chat, and study group management.

## Features

- 🔐 **Authentication** - Firebase Auth with Google sign-in
- 📚 **Study Groups** - Create and join study groups
- 🎥 **Video Conferencing** - WebRTC-based peer-to-peer video calls
- 💬 **Real-time Chat** - Live messaging during study sessions
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔥 **Firebase Integration** - Firestore for data, real-time updates

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd study-sprint
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

4. **Set up video conferencing**

```bash
cd signaling-server
npm install
npm start
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Video Conferencing Setup

For detailed video conferencing setup instructions, see [VIDEO_SETUP.md](./VIDEO_SETUP.md).

Quick setup:

1. Start signaling server: `cd signaling-server && npm start`
2. Start Next.js app: `npm run dev`
3. Join a room and grant camera/microphone permissions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **Video**: WebRTC, Socket.IO, SimplePeer
- **Real-time**: Firebase real-time listeners
- **Styling**: Tailwind CSS with custom components

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── components/         # Reusable components
│   │   ├── video/         # Video conferencing components
│   │   ├── Chat.tsx       # Chat component
│   │   └── ...
│   ├── dashboard/         # Dashboard pages
│   ├── room/             # Video call room pages
│   └── ...
├── context/              # React contexts
├── firebase/             # Firebase configuration and utilities
├── hooks/               # Custom React hooks
├── signaling-server/    # Socket.IO server for WebRTC
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [WebRTC Documentation](https://webrtc.org/getting-started/)
- [Socket.IO Documentation](https://socket.io/docs/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

For production deployment with video conferencing:

1. Deploy the Next.js app to Vercel
2. Deploy the signaling server to a service like Railway, Render, or Heroku
3. Update `NEXT_PUBLIC_SOCKET_URL` to point to your deployed signaling server
4. Ensure HTTPS is enabled (required for WebRTC)
