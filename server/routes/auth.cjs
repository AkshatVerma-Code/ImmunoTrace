const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db.cjs");
const { requireAuth } = require("../middleware/auth.cjs");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (req, res) => {
  const {
    email,
    password,
    name,
    age,
    height_cm,
    weight_kg,
    blood_group,
    allergies,
    location,
  } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
      (email, password_hash, name, age, height_cm, weight_kg, blood_group, allergies, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        passwordHash,
        name,
        age || null,
        height_cm || null,
        weight_kg || null,
        blood_group || null,
        allergies || null,
        location || null,
      ]
    );

    const [users] = await pool.query(
      `SELECT id, email, name, age, height_cm, weight_kg, blood_group, allergies, location, phone, health_score, created_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );
    const user = users[0];
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Failed to sign up." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      blood_group: user.blood_group,
      allergies: user.allergies,
      location: user.location,
      phone: user.phone,
      health_score: user.health_score,
      created_at: user.created_at,
    };

    const token = signToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to log in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, name, age, height_cm, weight_kg, blood_group, allergies, location, phone, health_score, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    console.error("Fetch me error:", error);
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
});

module.exports = router;
