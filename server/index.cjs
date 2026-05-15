require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.cjs");
const { pool } = require("./db.cjs");

const app = express();
const port = Number(process.env.SERVER_PORT || 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "API + MySQL connected" });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`ImmunoTrace API running on http://localhost:${port}`);
});
