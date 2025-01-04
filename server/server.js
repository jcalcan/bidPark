const express = require("express");
const app = require("./app.js"); // Import the app from app.js

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
