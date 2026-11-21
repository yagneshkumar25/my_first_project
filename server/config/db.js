
const { Pool } = require("pg");
require("dotenv").config({
    path: require("path").join(__dirname, "..", ".env")
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

pool.on("connect", (client) => {
    console.log("PostgreSQL connected to:", process.env.DB_NAME);
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error.message);
});

module.exports = pool;
