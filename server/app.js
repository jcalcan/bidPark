require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const client = require("./db"); // Import the database connection
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "../dist")));

// route to fetch all users
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
  const { email, password, first_name, last_name, phoneNumber } = req.body;

  try {
    console.log("Received registration request:", req.body);
    // Check if the email already exists
    const existingUser = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists. Please login or reset your password.",
        userExists: true
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user in the database
    const result = await client.query(
      "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [email, hashedPassword, first_name, last_name, phoneNumber]
    );

    const newUser = result.rows[0];
    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.status(201).json({
      message: "User registered successfully.",
      token: token,
      userId: newUser.id,
      userName: newUser.first_name
    });
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
    console.log(`user: ${user}`);

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({
      message: "Login successful.",
      token,
      user_id: user.user_id,
      first_name: user.first_name
    });
    // eventEmitter.emit("userLoggedIn", { userName: user.first_name });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Check if the user exists
    const user = await client.query("SELECT * FROM users WHERE phone = $1", [
      phoneNumber
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 3 minutes from now
    const expirationTime = new Date(Date.now() + 3 * 60 * 1000);

    // Store the reset code in the database
    await client.query(
      "UPDATE users SET reset_code = $1, reset_code_expires = $2 WHERE phone = $3",
      [resetCode, expirationTime, phoneNumber]
    );

    async function sendSMSResetCode(phoneNumber, resetCode) {
      try {
        await twilioClient.messages.create({
          body: `Your password reset code is: ${resetCode}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
      } catch (error) {
        console.error("Error sending SMS:", error);
        throw new Error("Failed to send SMS");
      }
    }

    res.json({ message: "Password reset code sent to phone.", resetCode });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res
      .status(500)
      .json({ message: "Error processing request.", error: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { phoneNumber, resetCode, newPassword } = req.body;

  try {
    // Check if the reset code is valid
    const user = await client.query(
      "SELECT * FROM users WHERE phone = $1 AND reset_code = $2 AND reset_code_expires > $3",
      [phoneNumber, resetCode, new Date()]
    );

    if (user.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset code
    await client.query(
      "UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires = NULL WHERE user_id = $2",
      [hashedPassword, user.rows[0].user_id]
    );

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
});

//Token Authentication Endpoint
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ message: "Token is valid" });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Export the app for use in server.js
module.exports = app;
