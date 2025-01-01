import AuctionManager from "../components/AuctionManager.js";
import User from "../components/User.js";

document.addEventListener("DOMContentLoaded", () => {
  const auctionManager = new AuctionManager();
  let currentUser = null;

  // Simulating user login
  function loginUser(userId, userName) {
    currentUser = new User(userId, userName);
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
  const endTime = startTime + 30000; // 30 sec from now

  const auction = auctionManager.createAuction(
    auctionId,
    startPrice,
    startTime,
    endTime
  );
  // console.log("Auction created:", auction);

  // Update auction display
  function updateAuctionDisplay() {
    const auctionContainer = document.querySelector(".auction-list__container");
    auctionContainer.innerHTML = ""; // Clear existing auctions

    const auctionElement = document.createElement("article");
    auctionElement.className = "auction-item";
    auctionElement.innerHTML = `
            <h3 class="auction-item__title">Alcantara Painting</h3>
            <img id="painting" alt="Alcantara painting" class="auction-item__image">
            <p class="auction-item__description">A rare Alcantara painting</p>
            <div class="auction-item__details">
                <span class="auction-item__current-bid">Current Bid: $${
                  auction.startBidPrice
                }</span>
                <span class="auction-item__time-remaining">Time Left: ${formatTimeRemaining(
                  auction.timeRemaining
                )}</span>
            </div>
            <button class="auction-item__bid-button">Place Bid</button>
        `;

    auctionContainer.appendChild(auctionElement);

    // Add event listener to bid button
    auctionElement
      .querySelector(".auction-item__bid-button")
      .addEventListener("click", () => {
        document.querySelector(".bid-form").style.display = "block";
      });
  }

  // Format time remaining
  function formatTimeRemaining(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }

  // Handle bid submission
  document.querySelector(".bid-form__form").addEventListener("submit", (e) => {
    e.preventDefault();
    const bidAmount = Number(document.querySelector(".bid-form__input").value);
    try {
      currentUser.placeBid(auctionManager, auctionId, bidAmount);
      updateAuctionDisplay();
      document.querySelector(".bid-form").style.display = "none";
    } catch (error) {
      alert(error.message);
    }
  });

  // Update display every second
  setInterval(updateAuctionDisplay, 1000);

  // Handle auction end
  auctionManager.on("auctionWinner", ({ auctionId, winnerId }) => {
    if (winnerId === currentUser.id) {
      alert(`Congratulations! You won auction ${auctionId}`);
    } else {
      alert(`Auction ${auctionId} has ended. The winner is user ${winnerId}`);
    }
  });

  // Initial display update
  updateAuctionDisplay();
});
