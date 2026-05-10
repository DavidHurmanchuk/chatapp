# ChatApp

A real-time chat application with AI integration, built with Next.js, Express, MongoDB, and Socket.io.

## Features

- 💬 **Real-time messaging** via Socket.io
- 🤖 **AI Assistant** powered by Groq (Llama 3.3 70B) — personal chats and group AI with `/groq` trigger
- 👥 **Group chats** with member management (add / leave / delete)
- 📩 **Direct messages** with soft delete
- 👍 **Emoji reactions** with optimistic UI and full picker
- ✓✓ **Read status** (delivered / seen)
- 🔔 **Unread counters** per conversation
- 🟢 **Online status** — see who is online in real time
- 🔐 **Authentication** — email/password + Google OAuth + GitHub OAuth
- 📱 **Responsive design** — mobile and desktop layouts
- 📝 **Markdown rendering** for AI responses
- ♾️ **Infinite scroll** pagination for message history

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API |
| MongoDB + Mongoose | Database |
| Socket.io | Real-time communication |
| JWT | Stateless authentication |
| Passport.js | Google & GitHub OAuth |
| Groq SDK | AI (Llama 3.3 70B) |
| Zod | Environment variable validation |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework |
| Tailwind CSS | Styling with custom design tokens |
| Socket.io-client | Real-time updates |
| ReactMarkdown + remark-gfm | Markdown rendering |
| Syne (Google Fonts) | Typography |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key — [console.groq.com](https://console.groq.com) (free tier available)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/chatapp.git
cd chatapp
```

**2. Backend**
```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

**3. Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

**4.** Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

**`backend/.env`**
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-long-random-secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Project Structure

```
chatapp/
├── README.md
├── DEPLOY.md
│
├── backend/
│   └── src/
│       ├── index.js                     # Server entry point
│       ├── config/
│       │   └── index.js                 # Zod env validation
│       ├── constants/
│       │   ├── http.js                  # HTTP_STATUS codes
│       │   └── events.js                # SOCKET_EVENTS names
│       ├── socket/
│       │   └── index.js                 # Socket.io + online status
│       ├── middleware/
│       │   └── auth.js                  # JWT middleware
│       ├── models/
│       │   ├── User.js
│       │   ├── Conversation.js
│       │   └── ConversationMessage.js
│       └── routes/
│           ├── auth.js                  # Auth + OAuth
│           ├── conversations.js         # Chats, messages, reactions
│           └── users.js                 # User search
│
└── frontend/
    └── app/
        ├── page.jsx                     # Main chat page
        ├── globals.css
        ├── login/
        │   └── page.jsx                 # Login / Register
        ├── auth/
        │   └── callback/
        │       └── page.jsx             # OAuth callback handler
        ├── utils/
        │   ├── api.js                   # API client + token management
        │   └── endpoints.js             # API endpoints + socket event constants
        ├── hooks/
        │   ├── useSocket.js             # Socket.io hook
        │   └── useOnlineUsers.js        # Online status hook
        └── components/
            ├── Sidebar.jsx
            ├── ChatHeader.jsx
            ├── MessageList.jsx
            ├── MessageBubble.jsx
            ├── ChatInput.jsx
            ├── NewConversationModal.jsx
            ├── AddMemberModal.jsx
            ├── LogoutModal.jsx
            └── Avatar.jsx
```

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) / [Railway](https://railway.app) |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |

See [DEPLOY.md](./DEPLOY.md) for full step-by-step instructions.

## License

MIT
