
const express = require("express");
const cors = require("cors");

require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");

const app = express();

console.log("UPDATED SWEETY SERVER LOADED");

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log("INCOMING REQUEST:", req.method, req.originalUrl);
    next();
});
// TEMPORARY TEST ROUTE
app.get("/api/readings-test", (req, res) => {
    res.json({
        message: "Readings route is working"
    });
});

// AUTHENTICATION ROUTES
app.use("/api/auth", authRoutes);

// GLUCOSE READING ROUTES
app.use("/api/readings", readingRoutes);
console.log("READING ROUTES MOUNTED");

// HOME ROUTE
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Sweety Blood Glucose Tracker API"
    });
});

// DATABASE HEALTH CHECK
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database_name,
                current_schema() AS schema_name,
                to_regclass('public.users') AS users_table
        `);

        res.json({
            status: "success",
            database: result.rows[0].database_name,
            schema: result.rows[0].schema_name,
            users_table: result.rows[0].users_table
        });

    } catch (error) {
        console.error("DATABASE ERROR:", error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed",
            details: error.message
        });
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Sweety server running on port ${PORT}`);
});
