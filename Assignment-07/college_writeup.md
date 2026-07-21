# Project Report: Water Usage Tracker

## 1. Title
**Water Usage Tracker — A MERN Stack Web Application**

## 2. Objective
The primary objectives of this project are:
1. **Develop a Full-Stack Platform:** To build a robust web application using the MERN stack for logging daily water consumption.
2. **Promote Water Conservation Awareness:** To help users visualize their daily water usage and understand their personal consumption patterns.
3. **Facilitate Convenient Tracking:** To provide an intuitive digital platform where individuals can easily categorize their water usage (e.g., Drinking, Bathing, Cleaning).
4. **Encourage Eco-Friendly Habits:** To motivate users to optimize their water usage and reduce wastage through personal data tracking and historical records.

## 3. Problem Statement
With the growing global concern over water scarcity, individuals often struggle to accurately gauge their personal daily water consumption. Without an accessible tracking mechanism, users remain unaware of their wastage patterns and lack the motivation or data necessary to optimize their water use. There is a need for an intuitive, centralized, and secure digital platform that enables users to effortlessly log, categorize, and visualize their water usage.

## 4. Outcome
The final outcome of this project is a fully functional, secure, and responsive web application where users can:
- Securely register and log in to a personalized dashboard.
- Log daily water usage entries, specifying the amount and category (e.g., Drinking, Bathing, Cleaning).
- View a comprehensive history of past consumption records.
- Make informed decisions to reduce unnecessary water waste based on logged data.

## 5. Hardware and Software Requirements

**Hardware Requirements:**
- **Processor:** Intel Core i3 / AMD Ryzen 3 or higher.
- **RAM:** Minimum 4 GB (8 GB recommended for development).
- **Storage:** At least 500 MB of free disk space.
- **Network:** Active internet connection (for package installation and API testing).

**Software Requirements:**
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Node.js:** Version 16.x or higher.
- **NPM Check:** npm v8.x or above (bundled with Node.js).
- **Database:** MongoDB Community Edition (running locally on port 27017) or MongoDB Atlas.
- **IDE:** Visual Studio Code (or any preferred code editor).
- **Web Browser:** Google Chrome, Mozilla Firefox, or Microsoft Edge.

## 6. Theory

The project utilizes the **MERN** stack, which is an acronym for **MongoDB, Express.js, React.js, and Node.js**. It involves creating a secure and scalable architecture separated into a client-side frontend and a server-side backend.

* **Frontend (Client):** Built using **React.js**. React allows us to build a Single Page Application (SPA) with reusable components. We leverage React Context API for state management (like User Authentication state) and React Router for navigational routing.
* **Backend (Server):** Built using **Node.js** and **Express.js**. Node provides the JavaScript runtime environment, while Express is a minimalist framework used to handle HTTP routing, middleware processing, and API endpoints. 
* **Database:** **MongoDB** is a NoSQL, document-oriented database used to store flexible JSON-like documents. We use **Mongoose** as an Object Data Modeling (ODM) library for MongoDB and Node.js to define strict database schemas.
* **Authentication:** Handled using **JSON Web Tokens (JWT)**. Passwords are securely hashed using `bcryptjs` before being stored in the database. 

### Important Code Snippets

#### 1. MongoDB (Mongoose Schema Definition)
The database structure is designed to connect water usage records to specific users via an `ObjectId` reference.
```javascript
// server/models/WaterUsage.js
const mongoose = require('mongoose');

const waterUsageSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('WaterUsage', waterUsageSchema);
```

#### 2. Express.js (Controller Logic for Creating a Record)
The Express controller handles the HTTP POST request. It extracts token-verified user information, creates a new MongoDB document, and returns a JSON response.
```javascript
// server/controllers/usageController.js
const WaterUsage = require('../models/WaterUsage');

exports.addUsage = async (req, res) => {
  try {
    const { amount, category, date } = req.body;
    
    // Create new entry linked to the logged-in user's ID
    const usage = await WaterUsage.create({
      user: req.user.id,
      amount,
      category,
      date
    });
    
    res.status(201).json({ success: true, data: usage });
  } catch (error) {
    console.error("Error adding usage:", error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
```

#### 3. React.js (Authentication Context & API Call)
React context handles global state. Here, we manage the JSON Web Token (JWT) locally and make Axios network requests to authenticate the user.
```javascript
// client/src/context/AuthContext.js
import { createContext, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      // Store token locally for persistent sessions
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 7. DESIGN / EXECUTION STEPS

### Phase 1: Environment Setup & Architecture
1. **Initialize Project:** Create the project root folder. Set up two separate directories: `client` and `server`.
2. **Install Dependencies (Backend):** Initialize npm in the server directory and install required packages (`express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`).
3. **Install Dependencies (Frontend):** Generate the React app via `npx create-react-app client` and install routing/HTTP packages (`react-router-dom`, `axios`).

### Phase 2: Backend Development (Node, Express, MongoDB)
4. **Database Configuration:** Set up the MongoDB connection connection in `server.js` using `mongoose.connect()`.
5. **Create Schemas:** Define `User` and `WaterUsage` schemas inside the `models` directory. Include password pre-save hooks in the `User` model using `bcryptjs`.
6. **Build Authentication API:** Implement user registration and login endpoints in `authController.js`. Assign JWTs upon successful authentication.
7. **Build Usage API:** Develop CRUD (Create, Read, Update, Delete) routes in `usageController.js` to manage the tracking data. Protect these routes with a custom middleware that validates the JWT.

### Phase 3: Frontend Development (React)
8. **Routing Setup:** Configure `App.js` with `react-router-dom` to manage distinct views (Login, Register, Dashboard, Add Record).
9. **Global State Management:** Create an `AuthContext` to store the user's login status and JWT persistently using the browser’s `localStorage`.
10. **Build UI Components:** Design modular components like `Navbar`, forms for user input, and tables to display fetched logging data. 
11. **API Integration:** Connect the React frontend to the Express backend via `axios`. Attach the JWT token inside request headers (e.g., `Authorization: Bearer <token>`) for protected routes.

### Phase 4: Testing & Deployment
12. **Local Testing:** Test endpoints via REST tools (Postman/Curl) and interact with the full SPA locally concurrently using tools like `nodemon` and React scripts.
13. **Final Review:** Validate error handling on malformed requests and ensure responsive UI behavior constraints.

## 8. Conclusion
The Water Usage Tracker successfully demonstrates the complete lifecycle of integrating a MERN stack application. By connecting an interactive React frontend with a robust Express and MongoDB backend, the project achieves its goal of providing a fast and secure platform for monitoring water consumption. The utilization of standard industry practices such as JWT authentication, password hashing, environment variables, and RESTful routing provides a solid framework that is highly scalable. Ultimately, the application serves a dual purpose: demonstrating technical proficiency in full-stack JavaScript web development and yielding a practical utility application that advocates for environmental self-awareness.
