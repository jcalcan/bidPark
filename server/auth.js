const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db"); // Import your db connection

const router = express.Router();

// User registration endpoint
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );
    res.status(201).json({ userId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "User registration failed" });
  }
});

// User login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        return res.json({ token });
      }
    }
    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
