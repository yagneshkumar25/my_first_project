# 💗 Sweety – Blood Glucose Tracker

A full-stack web application to record, manage, and monitor daily blood glucose readings.

## 📌 Project Overview

Sweety helps users maintain a record of their daily blood glucose levels. Users can securely create an account, log in, add readings, update or delete them, and view reports.

## ✨ Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Four daily time slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- Reading validation (40–600 mg/dl)
- Maximum four readings per day
- Prevent duplicate time slots for the same date
- Prevent future-date entries
- Daily glucose statistics
- Month-to-date reports
- Previous full-month reports
- User-specific reading access

## 🛠️ Technologies Used

**Frontend:** React.js, JavaScript, HTML, CSS, Axios, Vite

**Backend:** Node.js, Express.js

**Database:** PostgreSQL

**Authentication:** JWT, bcrypt

**Tools:** Visual Studio Code, Git, GitHub

## 📂 Project Structure

```text
sweety/
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── readingRoutes.js
│   ├── schema.sql
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── .env.example
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the server folder using the variables shown in `.env.example`.

### 3. Database Setup

- Install and open PostgreSQL.
- Create a database named `sweety_db`.
- Execute the SQL commands from `server/schema.sql`.
- Configure your PostgreSQL credentials in the server `.env` file.

### 4. Start the Backend

From the server folder:

```bash
node server.js
```

The backend runs on:

`http://localhost:5000`

### 5. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the frontend URL displayed by Vite, usually:

`http://localhost:5173`

## 📊 Reports

Sweety provides:

- Daily glucose reports
- Current month reports
- Previous full-month reports

Each report displays reading count, average, highest, and lowest glucose values.

## 🔐 Security

- Passwords are hashed using bcrypt.
- JWT authentication protects private API routes.
- Users can access only their own readings.
- Environment variables are used for database credentials and authentication secrets.

## 📝 Notes

- Glucose readings are stored in mg/dl.
- Valid reading values are whole numbers from 40 to 600.
- Each time slot can have only one reading per date.
- A maximum of four readings is allowed per day.
- Future dates are not permitted.

## 👨‍💻 Project

**Sweety – Blood Glucose Tracker**

Developed as a full-stack JavaScript application using React, Node.js, Express, and PostgreSQL.
