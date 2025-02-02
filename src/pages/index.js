import AuctionManager from "../components/AuctionManager.js";
import User from "../components/User.js";
import EventEmitter from "../components/EventEmitter.js";
import "./index.css";
import "./register";
import "./login.js";
import { verifyTokenAndUpdateUI } from "../../server/authUtils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-easybutton";
import { v4 as uuidv4 } from "uuid"; // Importing UUID from npm
import { eventEmitter } from "./login.js";

let currentUser = null;
// const eventEmitter = new EventEmitter();
const auctionManager = new AuctionManager(eventEmitter);
import painting from "../images/3-photo-by-tubanur-dogan-from-pexels.jpg";

document.addEventListener("DOMContentLoaded", () => {
  // Listen for user login events
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const loginSection = document.querySelector(".login");
  const forgotPasswordSection = document.querySelector(".forgot-password");
  const resetCodeSection = document.getElementById("resetCodeSection");
  const sendResetCodeBtn = document.getElementById("sendResetCodeBtn");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const backToLoginLink = document.getElementById("backToLoginLink");

  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.style.display = "none";
    forgotPasswordSection.style.display = "block";
  });

  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phoneNumber = document.getElementById("reset_phone").value;
    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      document.querySelector(".reset-message").textContent =
        "Invalid phone number format. Use XXX-XXX-XXXX without dashes";
      return;
    }
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await response.json();
      if (response.ok) {
        document.querySelector(".reset-message").textContent = data.message;
        console.log(data.message);
        resetCodeSection.style.display = "block";
        sendResetCodeBtn.style.display = "none";
        startResetCodeCountdown();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      document.querySelector(".reset-message").textContent = error.message;
      document.querySelector(".reset-message").style.color = "red";
    }
    forgotPasswordForm.reset();
  });

  function startResetCodeCountdown() {
    let timeLeft = 180; // 3 minutes in seconds
    const countdownElement = document.createElement("p");
    document.querySelector(".forgot-password").appendChild(countdownElement);

    const countdownInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownElement.textContent = `Code expires in: ${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent =
          "Reset code has expired. Please request a new one.";
      }
      timeLeft--;
    }, 1000);
  }

  resetPasswordForm.addEventListener("click", async (e) => {
    e.preventDefault();
    const phoneNumber = document.getElementById("reset_phone").value;
    const resetCode = document.getElementById("resetCode").value;
    const newPassword = document.getElementById("newPassword").value;
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, resetCode, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        document.querySelector(".reset-message").textContent = data.message;
        setTimeout(() => backToLogin(), 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      document.querySelector(".reset-message").textContent = error.message;
    }
  });

  function backToLogin() {
    loginSection.style.display = "block";
    forgotPasswordSection.style.display = "none";
    resetCodeSection.style.display = "none";
    resetPasswordForm.style.display = "none";
    resetPasswordForm.reset();
    forgotPasswordForm.reset();
    document.querySelector(".reset-message").textContent = "";
  }

  backToLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    backToLogin();
  });

  // Check if user is authenticated and handle login events
  function initializeUserSession() {
    const token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");

    if (token) {
      verifyTokenAndUpdateUI(token)
        .then((user) => {
          setupAuthenticatedUser(user.id, user.name);
          backToLogin();
          toggleAuctionCreation(true);
        })
        .catch((err) => {
          console.error("Authentication failed:", err);
          toggleAuctionCreation(false);
        });
    } else {
      toggleAuctionCreation(false);
    }

    // Listen for user login events
    eventEmitter.on("userLoggedIn", ({ userId, userName }) => {
      console.log(`User logged in: ${userName}`);
      setupAuthenticatedUser(userId, userName);
      backToLogin(); // Hide login form
      toggleAuctionCreation(true); // Show auction creation form
    });
  }

  function setupAuthenticatedUser(userId, userName) {
    currentUser = new User(userId, userName, eventEmitter);
    toggleAuctionCreation(true);
    attachMapClickListener(currentUser);
  }

  // Call this function to initialize the user session
  initializeUserSession();

  // Map initialization
  const map = L.map("map").setView([51.505, -0.09], 13); // Default view
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  L.easyButton("fa-location-arrow", function (btn, map) {
    map.locate({ setView: true, maxZoom: 18 });
  }).addTo(map);

  let selectedCoordinates = null; // To store selected coordinates

  // Function to get user location and set map view
  function locateUser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const userLocation = L.latLng(userLat, userLng);
          map.setView(userLocation, 15); // Zoom level can be adjusted

          // Create a circle around the user's location with a radius of 0.25 miles
          L.circle(userLocation, {
            color: "blue",
            fillColor: "#30f",
            fillOpacity: 0.5,
            radius: 402
          }).addTo(map);

          // Optionally add a marker for the user's location
          L.marker(userLocation)
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  // Call locateUser on load to show the map and user location
  locateUser();

  function toggleAuctionCreation(isLoggedIn) {
    const auctionContainer = document.getElementById("auctionContainer");
    const auctionFormSection = document.querySelector(".auction-creation");
    const registrationSection = document.querySelector(".registration");

    if (isLoggedIn) {
      auctionContainer.style.display = "block"; // Show auction container
      auctionFormSection.style.display = "block"; // Show auction form section
      registrationSection.style.display = "none"; //Hide registration form section
    } else {
      auctionContainer.style.display = "none"; // Hide auction container
      auctionFormSection.style.display = "none"; // Hide auction form section
      alert("Please log in to create an auction."); // Inform the user
    }
  }

  function attachMapClickListener(currentUser) {
    console.log(`in attachMapClickListener function`);
    map.on("click", function (e) {
      console.log("Map clicked at:", e.latlng); // Log the clicked coordinates
      if (currentUser) {
        selectedCoordinates = e.latlng; // Store clicked coordinates
        console.log("Current User:", currentUser); // Log current user info
        console.log("Selected Coordinates:", selectedCoordinates); // Log selected coordinates

        const coordinatesString = `${selectedCoordinates.lat.toFixed(
          6
        )},${selectedCoordinates.lng.toFixed(6)}`;

        // Update display element with the coordinates
        document.getElementById(
          "coordinatesDisplay"
        ).textContent = `Selected Coordinates: ${coordinatesString}`;

        // Update the auctionDescription input
        document.getElementById("auctionDescription").value = coordinatesString;

        // Optionally scroll to the auction form section to make it visible
        document
          .querySelector(".auction-creation")
          .scrollIntoView({ behavior: "smooth" });
      } else {
        console.log("User is not logged in."); // Log if user is not logged in
        alert("Please log in to create an auction.");
      }
    });
  }

  // Auction creation form handling
  const auctionForm = document.getElementById("auctionForm");

  if (auctionForm) {
    console.log(`in auctionForm function in index.js`);
    auctionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title =
        auctionForm.querySelector("#auctionTitle").value || "Parking Available";

      const startingPrice = auctionForm.querySelector("#startingPrice").value;

      const selectedCoordinates = auctionForm.querySelector(
        "#auctionDescription"
      ).value;

      if (!selectedCoordinates) {
        alert("Please select a location on the map.");
        return;
      }

      // Parse the coordinates string into lat and lng
      const [lat, lng] = selectedCoordinates
        .split(",")
        .map((coord) => parseFloat(coord.trim()));

      const description = `Parking spot at coordinates: ${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;
      const auctionId = `${uuidv4()}-${Date.now()}`;
      const startTime = Date.now();
      const endTime = startTime + 20000;
      console.log(`start time: ${startTime}`);
      console.log(`end time: ${endTime}`);

      const auction = auctionManager.createAuction(
        auctionId,
        startingPrice,
        startTime,
        endTime,
        title,
        description,
        { lat, lng }
      );
      auction.startAuction();
      updateAuctionDisplay(auction);
      auctionForm.reset();
      document.getElementById("coordinatesDisplay").textContent = "";
    });
  }

  function updateAuctionDisplay(auction) {
    console.log(`auction object: ${JSON.stringify(auction, null, 2)}`);
    const auctionContainer = document.getElementById("auctionContainer");
    const auctionElement = document.createElement("article");

    auctionElement.className = "auction-item";
    auctionElement.dataset.auctionId = auction.auctionId;

    auctionElement.innerHTML = `
          <h3 class="auction-item__title">${auction.title}</h3>
          <img src="${painting}" alt="${
      auction.description
    }" class="auction-item__image" />
          <p class="auction-item__description">${auction.description}</p>
          <div class="auction-item__details">
              <span class="auction-item__current-bid">Current Bid: $${
                auction.startPrice
              }</span>
              <span class="auction-item__time-remaining" id="time-remaining-${
                auction.endTime
              }">Time Left: ${formatTimeRemaining(20000)}</span>
          </div>
          <!-- Bid form specific to this auction -->
          <form class="bid-form__form">
              <input type="number" class="bid-form__input" placeholder="Enter your bid amount" required />
              <button type="submit" class="bid-form__submit">Place Bid</button>
              <!-- Error message span for displaying validation messages -->
              <span class="error-message" style="color: red;"></span>
          </form>`;

    auctionContainer.appendChild(auctionElement);

    const bidForm = auctionElement.querySelector(".bid-form__form");

    bidForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const bidAmount = Number(bidForm.querySelector(".bid-form__input").value);
      const errorMessageElement = bidForm.querySelector(".error-message");

      eventEmitter.emit("bidPlaced", {
        userId: localStorage.getItem("userId"),
        auctionId: auction.auctionId,
        amount: bidAmount,
        errorMessageElement
      });

      bidForm.reset();
    });

    startCountdown(auction.endTime).then(() => {
      const winner = auction.getWinner();
      const highestBid = auction.highestBid;

      if (winner) {
        // Emit auctionEnded event with actual winner details
        eventEmitter.emit("auctionEnded", {
          winnerId: winner.id,
          winningAmount: highestBid
        });
      } else {
        eventEmitter.emit("auctionEnded", {
          winnerId: null,
          winningAmount: 0
        }); // No bids were placed
      }
    });

    eventEmitter.on("auctionEnded", ({ winnerId, winningAmount }) => {
      alert(
        `ALERT from emitter ON:in countdown function :::Auction ended! Winner: ${winnerId}, Winning Amount: $${winningAmount}`
      );
      alert(
        `ALERT from emitter ON:in countdown function :::Seller has been notified about the winning bid of $${winningAmount}.`
      );
    });
  }

  function formatTimeRemaining(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ${seconds % 60}s`;
  }

  function startCountdown(endTime) {
    const timeRemainingElement = document.getElementById(
      `time-remaining-${endTime}`
    );

    return new Promise((resolve) => {
      const intervalId = setInterval(() => {
        const now = Date.now();
        const remainingTime = endTime - now;

        if (remainingTime <= 0) {
          clearInterval(intervalId);
          timeRemainingElement.textContent = "Time Left: Auction has ended!";

          // Resolve the promise when the countdown ends
          resolve();
          return;
        }

        timeRemainingElement.textContent = `Time Left: ${formatTimeRemaining(
          remainingTime
        )}`;
      }, 1000); //update UI every second
    });
  }
});
