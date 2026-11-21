
const express = require("express");
const router = express.Router();

console.log("READING ROUTES FILE LOADED");

const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// ADD GLUCOSE READING
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        const validSlots = [
            "Morning (fasting)",
            "After breakfast",
            "After lunch",
            "After dinner"
        ];

        if (!reading_date || !time_slot || glucose_value === undefined) {
            return res.status(400).json({ message: "Date, time slot and glucose value are required" });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
            return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
        }

        const date = new Date(`${reading_date}T00:00:00Z`);

        if (Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== reading_date) {
            return res.status(400).json({ message: "Invalid date" });
        }

        const dateCheck = await pool.query(
            "SELECT $1::date > CURRENT_DATE AS is_future",
            [reading_date]
        );

        if (dateCheck.rows[0].is_future) {
            return res.status(400).json({ message: "Future dates are not allowed" });
        }

        if (!validSlots.includes(time_slot)) {
            return res.status(400).json({ message: "Invalid time slot" });
        }

        if (!Number.isInteger(glucose_value) ||
            glucose_value < 40 || glucose_value > 600) {
            return res.status(400).json({ message: "Glucose value must be an integer between 40 and 600" });
        }

        const result = await pool.query(
            `INSERT INTO readings
             (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.id, reading_date, time_slot, glucose_value]
        );

        res.status(201).json({
            message: "Reading added successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this date and time slot"
            });
        }

        console.error("ADD READING ERROR:", error);
        res.status(500).json({ message: "Failed to add reading" });
    }
});

// DASHBOARD SUMMARY
router.get("/dashboard/summary", authenticateToken, async (req, res) => {
    try {
        const totalResult = await pool.query(
            `SELECT COUNT(*)::int AS total_readings,
                    COALESCE(ROUND(AVG(glucose_value)::numeric, 1), 0) AS average_glucose
             FROM readings WHERE user_id = $1`,
            [req.user.id]
        );

        const latestResult = await pool.query(
            `SELECT id, reading_date, time_slot, glucose_value
             FROM readings WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC LIMIT 1`,
            [req.user.id]
        );

        const weeklyResult = await pool.query(
            `SELECT reading_date, COUNT(*)::int AS reading_count,
                    ROUND(AVG(glucose_value)::numeric, 1) AS average_glucose
             FROM readings
             WHERE user_id = $1
               AND reading_date >= CURRENT_DATE - INTERVAL '6 days'
               AND reading_date < CURRENT_DATE + INTERVAL '1 day'
             GROUP BY reading_date
             ORDER BY reading_date ASC`,
            [req.user.id]
        );

        res.status(200).json({
            message: "Dashboard summary fetched successfully",
            total_readings: totalResult.rows[0].total_readings,
            average_glucose: Number(totalResult.rows[0].average_glucose),
            latest_reading: latestResult.rows[0] || null,
            weekly_summary: weeklyResult.rows
        });

    } catch (error) {
        console.error("DASHBOARD SUMMARY ERROR:", error);
        res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
});

// TIME-SLOT SUMMARY
router.get("/dashboard/time-slots", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT time_slot, COUNT(*)::int AS reading_count,
                    ROUND(AVG(glucose_value)::numeric, 1) AS average_glucose
             FROM readings
             WHERE user_id = $1
             GROUP BY time_slot
             ORDER BY CASE time_slot
                WHEN 'Morning (fasting)' THEN 1
                WHEN 'After breakfast' THEN 2
                WHEN 'After lunch' THEN 3
                WHEN 'After dinner' THEN 4
             END`,
            [req.user.id]
        );

        res.status(200).json({
            message: "Time-slot summary fetched successfully",
            time_slot_summary: result.rows
        });

    } catch (error) {
        console.error("TIME SLOT SUMMARY ERROR:", error);
        res.status(500).json({ message: "Failed to fetch time-slot summary" });
    }
});

// GET ALL GLUCOSE READINGS
router.get("/", authenticateToken, async (req, res) => {
    try {
        console.log("GET READINGS USER ID:", req.user.id);
        console.log("GET READINGS REQUEST RECEIVED");

        const result = await pool.query(
            `SELECT id, user_id,
                    reading_date::text AS reading_date,
                    time_slot, glucose_value, created_at, updated_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, id DESC`,
            [req.user.id]
        );

        console.log("GET READINGS COUNT:", result.rows.length);

        res.status(200).json({
            message: "Readings fetched successfully",
            total: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("GET READINGS ERROR:", error);
        res.status(500).json({ message: "Failed to fetch readings" });
    }
});

// UPDATE EXISTING GLUCOSE READING
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, time_slot, glucose_value } = req.body;

        const validSlots = [
            "Morning (fasting)",
            "After breakfast",
            "After lunch",
            "After dinner"
        ];

        if (!reading_date || !time_slot || glucose_value === undefined) {
            return res.status(400).json({ message: "Please provide reading_date, time_slot and glucose_value" });
        }

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({ message: "Invalid reading ID" });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
            return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
        }

        const date = new Date(`${reading_date}T00:00:00Z`);

        if (Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== reading_date) {
            return res.status(400).json({ message: "Invalid calendar date" });
        }

        const dateCheck = await pool.query(
            "SELECT $1::date > CURRENT_DATE AS is_future",
            [reading_date]
        );

        if (dateCheck.rows[0].is_future) {
            return res.status(400).json({ message: "Future dates are not allowed" });
        }

        if (!validSlots.includes(time_slot)) {
            return res.status(400).json({ message: "Invalid time slot" });
        }

        const glucose = Number(glucose_value);

        if (glucose_value === "" || !Number.isInteger(glucose) ||
            glucose < 40 || glucose > 600) {
            return res.status(400).json({ message: "Glucose value must be an integer between 40 and 600" });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1, time_slot = $2,
                 glucose_value = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING id, user_id, reading_date, time_slot,
                       glucose_value, created_at, updated_at`,
            [reading_date, time_slot, glucose, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Reading not found" });
        }

        res.status(200).json({
            message: "Reading updated successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this date and time slot"
            });
        }

        console.error("UPDATE READING ERROR:", error);
        res.status(500).json({ message: "Failed to update reading" });
    }
});

// DELETE GLUCOSE READING
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({ message: "Invalid reading ID" });
        }

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id, reading_date, time_slot, glucose_value`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Reading not found" });
        }

        res.status(200).json({
            message: "Reading deleted successfully",
            deletedReading: result.rows[0]
        });

    } catch (error) {
        console.error("DELETE READING ERROR:", error);
        res.status(500).json({ message: "Failed to delete reading" });
    }
});

module.exports = router;
