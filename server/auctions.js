const express = require("express");
const pool = require("./db"); // Import your db connection
const authenticateToken = require("./middleware"); // Import the authentication middleware

const router = express.Router();

// Create Auction endpoint
router.post("/auctions", authenticateToken, async (req, res) => {
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

module.exports = router;
