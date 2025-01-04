const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  database: "bidParkDB",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// For JWT
// const jwt = require("jsonwebtoken");
// const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

// Connect to the database
pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database!");
    // You can execute queries here if needed
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

// Export the client for use in other parts of your application
module.exports = pool;
