require("dotenv").config();
const express = require("express");
const path = require("path");
const client = require("./db"); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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

// Export the app for use in server.js
module.exports = app;
