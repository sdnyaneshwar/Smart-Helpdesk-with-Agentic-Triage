# Smart Helpdesk

A MERN stack helpdesk with AI-powered ticket triage using Node.js, React, MongoDB, Redis Cloud, and Docker.

## Features
- User ticket creation and viewing.
- Agent ticket assignment and replies.
- Admin KB management and system settings.
- AI triage with Redis queue and MongoDB audit logs.
- Role-based access (user, agent, admin).
- Responsive UI with Tailwind CSS.

## File Structure
├── .gitignore
├── client
    ├── .gitignore
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── public
    │   └── vite.svg
    ├── src
    │   ├── App.css
    │   ├── App.jsx
    │   ├── assets
    │   │   └── react.svg
    │   ├── components
    │   │   ├── NavBar.jsx
    │   │   └── ToastContainer.jsx
    │   ├── index.css
    │   ├── lib
    │   │   └── api.js
    │   ├── main.jsx
    │   ├── pages
    │   │   ├── KBEditor.jsx
    │   │   ├── KBList.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Settings.jsx
    │   │   ├── TicketDetail.jsx
    │   │   ├── TicketList.jsx
    │   │   └── TicketNew.jsx
    │   └── store
    │   │   └── authStore.js
    └── vite.config.js
└── server
    ├── package-lock.json
    ├── package.json
    └── src
        ├── index.js
        ├── middlewares
            └── authMiddleware.js
        ├── models
            ├── agentSuggestion.js
            ├── article.js
            ├── auditLog.js
            ├── config.js
            ├── ticket.js
            └── user.js
        ├── routes
            ├── audit.js
            ├── auth.js
            ├── config.js
            ├── kb.js
            └── tickets.js
        ├── seed.js
        └── services
            └── agentService.js

## Setup
1. Clone Repository:
   ```bash
   git clone <repo-url>
   cd smart-helpdesk
```

2. Backend Setup:

   cd server
   npm install
   cp .env.example .env

   Edit `.env` with MongoDB Atlas, Redis Cloud, and JWT_SECRET.

3. Frontend Setup:

   ```bash
   cd client
   npm install
   ```

4. Run Locally:

   ```bash
   docker-compose up --build
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:8080

5. Seed Data:

   ```bash
   docker-compose exec backend npm run seed
   ```

6. Run Tests:

   ```bash
   cd server
   npm run test
   cd ../client
   npm run test
   ```

## Deployment

- Deploy to Render with Docker Compose.
- Set environment variables in Render dashboard.
- Use MongoDB Atlas and Redis Cloud for DB and queue.

## Testing

- Backend: Jest/Supertest for API and workflow.
- Frontend: Jest/React Testing Library for UI flows.