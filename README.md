# Sweety – Blood Glucose Tracker

Sweety is a full-stack web application that helps users record, manage, and monitor their daily blood glucose readings.

## Features

- User registration and secure login
- Password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Four daily reading slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- Glucose values between 40 and 600 mg/dL
- Maximum four readings per day
- Prevents duplicate time slots and future dates
- Daily, month-to-date, and previous-month reports
- Displays highest, lowest, and average glucose levels
- User-specific data privacy

## Technologies Used

**Frontend:** React.js, JavaScript, HTML, CSS

**Backend:** Node.js, Express.js

**Database:** PostgreSQL

**Authentication:** JWT, bcrypt

**Tools:** VS Code, Git, GitHub

## Project Structure

```text
sweety/
├── client/
│   ├── public/
│   └── src/
├── server/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── schema.sql
│   ├── seed.js
│   ├── server.js
│   └── .env.example
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/yagneshkumar25/my_first_project.git
cd my_first_project
```

### 2. Set up the PostgreSQL database

Create a PostgreSQL database named `sweety_db`.

Run the SQL commands from:

```text
server/schema.sql
```

### 3. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` and configure your PostgreSQL credentials and JWT secret.

Start the backend:

```bash
node server.js
```

### 4. Set up the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Demo Data

To create sample data, run the seed script from the server folder:

```bash
node seed.js
```

The script creates a demo user and sample glucose readings.

## Security

- Passwords are hashed using bcrypt.
- Protected routes use JWT authentication.
- Users can access only their own glucose readings.
- Environment variables are excluded from Git tracking.

## Developer Notes

This project was developed as a full-stack development assignment.

The application focuses on authentication, CRUD operations, database integration, input validation, and report generation.

## GitHub Repository

https://github.com/yagneshkumar25/my_first_project