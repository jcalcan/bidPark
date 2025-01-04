require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const client = require("./db"); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "../dist")));

// Example route to fetch all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Internal Server Error");
  }
});

// User Registration Endpoint
app.post("/api/auth/register", async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    console.log("Received registration request:", req.body);
    // Check if the email already exists
    const existingUser = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user in the database
    const result = await client.query(
      "INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashedPassword, first_name, last_name]
    );

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Error registering user." });
  }
});
// User Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body; // Use email instead of username

  try {
    console.log("Received login request:", req.body);

    // Retrieve user record from the database based on email
    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.rows[0];

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ message: "Login successful.", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in." });
  }
});

// Export the app for use in server.js
module.exports = app;
