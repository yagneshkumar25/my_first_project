
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./config/db");

async function seedDatabase() {
  try {
    // Create a demo user
    const email = "demo@sweety.com";
    const password = "SweetyDemo123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ["Sweety Demo", email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    // Add sample readings only if they do not already exist
    const samples = [
      ["2026-11-20", "Morning (fasting)", 95],
      ["2026-11-20", "After breakfast", 130],
      ["2026-11-21", "Morning (fasting)", 100],
      ["2026-11-21", "After lunch", 145],
    ];

    for (const [date, slot, glucose] of samples) {
      await pool.query(
        `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot)
         DO NOTHING`,
        [userId, date, slot, glucose]
      );
    }

    console.log("Sweety demo data seeded successfully!");
    console.log("Demo email:", email);
    console.log("Demo password:", password);
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await pool.end();
  }
}

seedDatabase();
