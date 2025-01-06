const express = require("express");
const pool = require("./db"); // Import your db connection
const authenticateToken = require("./middleware"); // Import the authentication middleware

const router = express.Router();

// Create Auction endpoint
router.post("/api/auctions", authenticateToken, async (req, res) => {
  const { title, description, startingPrice } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO auctions (title, description, starting_price, created_by) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, description, startingPrice, req.user.userId] // Use authenticated user's ID
    );
    res.status(201).json({ auctionId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create auction" });
  }
});

// Other auction-related endpoints can also use authenticateToken as needed
// Assuming this is in a file like auction.js or index.js
export async function startAuction(auctionData) {
  const userId = localStorage.getItem("userId"); // Retrieve the stored user ID

  if (!userId) {
    alert("You must be logged in to start an auction.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auctions", {
      // Ensure this matches your backend route
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({
        title: auctionData.title,
        description: auctionData.description,
        startingPrice: auctionData.startingPrice, // Ensure this matches your backend expected structure
        created_by: userId // You can include user_id if needed, but it's already handled in the backend
      })
    });

    const result = await response.json();

    if (response.ok) {
      alert("Auction started successfully! Auction ID: " + result.auctionId);
      console.log(result);
      // Optionally redirect or update UI here
    } else {
      alert(result.error || "Failed to start auction.");
    }
  } catch (error) {
    console.error("Error starting auction:", error);
  }
}

module.exports = router;
