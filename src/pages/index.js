import AuctionManager from "../components/AuctionManager.js";
import User from "../components/User.js";
import EventEmitter from "../components/EventEmitter.js";
import "./index.css";
import "./register";

import painting from "../images/1-photo-by-moritz-feldmann-from-pexels.jpg";

document.addEventListener("DOMContentLoaded", () => {
  const eventEmitter = new EventEmitter();
  const auctionManager = new AuctionManager(eventEmitter);

  let currentUser = null;

  // Simulating user login
  function loginUser(userId, userName) {
    currentUser = new User(userId, userName, eventEmitter);
    document.querySelector(
      ".header__title"
    ).textContent = `Welcome, ${userName}!`;
  }

  // Initialize with a mock user
  loginUser("user123", "John Doe");

  // Create a sample auction
  const auctionId = "auction001";
  const startPrice = 100;
  const startTime = Date.now();
  const endTime = startTime + 20000; // Auction lasts for 20 seconds

  const auction = auctionManager.createAuction(
    auctionId,
    startPrice,
    startTime,
    endTime
  );

  // Start the auction immediately after creation
  auction.startAuction();

  // Update auction display and bind auction ID to bid forms
  function updateAuctionDisplay() {
    const auctionContainer = document.querySelector(".auction-list__container");
    auctionContainer.innerHTML = ""; // Clear existing auctions

    const auctionElement = document.createElement("article");
    auctionElement.className = "auction-item";
    auctionElement.dataset.auctionId = auctionId; // Set data attribute for the auction ID
    auctionElement.innerHTML = `
      <h3 class="auction-item__title">Alcantara Painting</h3>
      <img src="${painting}" id="painting" alt="" class="auction-item__image" />
      <p class="auction-item__description">A rare vintage Alcantara painting</p>
      <div class="auction-item__details">
        <span class="auction-item__current-bid">Current Bid: $${startPrice}</span>
        <span class="auction-item__time-remaining" id="time-remaining">Time Left: ${formatTimeRemaining(
          20000
        )}</span>
      </div>

      <!-- Bid form specific to this auction -->
      <form class="bid-form__form">
        <input type="number" class="bid-form__input" placeholder="Enter your bid amount" required />
        <button type="submit" class="bid-form__submit">Place Bid</button>
        <!-- Error message span for displaying validation messages -->
        <span class="error-message" style="color: red;"></span> 
      </form>
    `;

    auctionContainer.appendChild(auctionElement);

    // Add event listener for bid form submission
    const bidForm = auctionElement.querySelector(".bid-form__form");
    bidForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const bidAmount = Number(bidForm.querySelector(".bid-form__input").value);
      const errorMessageElement = bidForm.querySelector(".error-message"); // Select the error message span
      const currentAuctionId =
        bidForm.closest(".auction-item").dataset.auctionId; // Get auction ID from data attribute

      // Clear previous error messages
      errorMessageElement.textContent = "";

      // Emit the bidPlaced event with necessary parameters
      eventEmitter.emit("bidPlaced", {
        userId: currentUser.id,
        auctionId: currentAuctionId,
        amount: bidAmount,
        errorMessageElement
      });

      // Optionally reset the form after submission
      bidForm.reset();
    });

    // Start updating time remaining
    startCountdown(endTime);

    // Listen for auction end notifications
    const handleAuctionEnded = ({ winnerId, winningAmount }) => {
      alert(
        `Auction ended! Winner: ${winnerId}, Winning Amount: $${winningAmount}`
      );

      // Notify the seller as well (you may need to adjust how you access seller info)
      alert(
        `Seller has been notified about the winning bid of $${winningAmount}.`
      );

      // Remove this listener after the auction ends
      eventEmitter.off("auctionEnded", handleAuctionEnded);
    };

    eventEmitter.on("auctionEnded", handleAuctionEnded);
  }

  // Function to format time remaining
  function formatTimeRemaining(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }

  // Function to start countdown and update time remaining in DOM
  function startCountdown(endTime) {
    const timeRemainingElement = document.getElementById("time-remaining");

    const intervalId = setInterval(() => {
      const now = Date.now();
      const remainingTime = endTime - now;

      if (remainingTime <= 0) {
        clearInterval(intervalId); // Stop the countdown when time is up
        timeRemainingElement.textContent = "Time Left: Auction has ended!";
        auction.endAuction();
        return; // Optionally handle end of auction logic here
      }

      timeRemainingElement.textContent = `Time Left: ${formatTimeRemaining(
        remainingTime
      )}`;
    }, 1000); // Update every second
  }

  // Initial display update
  updateAuctionDisplay();
});
