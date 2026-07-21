# 💧 Water Usage Tracker — MERN Stack

A beginner-friendly full-stack web application to log and monitor daily water consumption.
Built with **MongoDB · Express.js · React.js · Node.js**.

---

## 📁 Folder Structure

```
water-usage-tracker/
├── client/                   ← React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── context/
│       │   └── AuthContext.js        ← Global auth state (JWT)
│       ├── components/
│       │   └── Navbar.js             ← Top navigation bar
│       ├── pages/
│       │   ├── Register.js           ← Sign-up page
│       │   ├── Login.js              ← Login page
│       │   ├── Dashboard.js          ← Summary stats
│       │   ├── AddUsage.js           ← Form to add a record
│       │   └── ViewRecords.js        ← Table of all records
│       ├── App.js                    ← Routes & layout
│       ├── index.js                  ← React entry point
│       └── index.css                 ← All styles
│
└── server/                   ← Node/Express backend
    ├── models/
    │   ├── User.js                   ← Mongoose User schema
    │   └── WaterUsage.js             ← Mongoose WaterUsage schema
    ├── controllers/
    │   ├── authController.js         ← register / login logic
    │   └── usageController.js        ← CRUD for water records
    ├── routes/
    │   ├── auth.js                   ← /api/auth/*
    │   └── usage.js                  ← /api/usage/*
    ├── middleware/
    │   └── auth.js                   ← JWT protect middleware
    ├── .env.example                  ← Sample environment variables
    └── server.js                     ← Express app entry point
```

---

## 🚀 How to Run the Project

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | ≥ 16.x |
| npm | ≥ 8.x |
| MongoDB | Running locally on port 27017 |

> **MongoDB setup**: Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
> Start it with: `mongod` (or via MongoDB Compass)

---

### Step 1 — Clone / extract the project

```bash
cd water-usage-tracker
```

---

### Step 2 — Set up the Backend

```bash
cd server
npm install
```

Create a `.env` file (copy from the example):

```bash
cp .env.example .env
```

The default `.env` values work out-of-the-box for a local setup:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/water_usage_tracker
JWT_SECRET=my_super_secret_key_change_this
```

Start the backend:

```bash
npm start
# OR for auto-restart on file changes:
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:5000
```

---

### Step 3 — Set up the Frontend

Open a **new terminal tab/window**:

```bash
cd client
npm install
npm start
```

React will open **http://localhost:3000** in your browser automatically.

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get JWT token | ❌ |
| GET | `/api/usage` | Get all usage records | ✅ |
| POST | `/api/usage` | Add new usage record | ✅ |
| DELETE | `/api/usage/:id` | Delete a record | ✅ |

---

## 🧪 Testing the API (with curl)

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"123456"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"123456"}'
```

**Add Usage** (replace `<token>` with JWT from login):
```bash
curl -X POST http://localhost:5000/api/usage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":2.5,"category":"Drinking","date":"2025-01-15"}'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | bcryptjs (password hashing) + JWT |
| Styling | Custom CSS (no UI framework) |

---

## 📝 Notes for Students

- Passwords are **never stored in plain text** — bcrypt hashes them before saving.
- The JWT token is stored in `localStorage` and sent with every protected API request via the `Authorization: Bearer <token>` header.
- The `proxy` field in `client/package.json` forwards API calls from React dev server → Express automatically.
- All backend routes under `/api/usage` are protected by the `protect` middleware in `server/middleware/auth.js`.
