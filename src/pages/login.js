import { getValidToken } from "../../server/authUtils";
import EventEmitter from "../components/EventEmitter.js";

const eventEmitter = new EventEmitter();

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login_email").value;
    const password = document.getElementById("login_password").value;

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();
      console.log(`result object: ${JSON.stringify(result, null, 2)}`);

      if (response.ok) {
        alert(result.message);

        console.log("JWT Token:", result.token); // Store this token for future requests
        localStorage.setItem("jwtToken", result.token);
        console.log("Stored JWT Token:", localStorage.getItem("jwtToken"));

        localStorage.setItem("userName", result.first_name);
        localStorage.setItem("userId", result.user_id);
        document.getElementById("loginForm").reset();

        eventEmitter.emit("userLoggedIn", { userName: result.first_name });

        // Remove the registration section from the DOM
        const registrationSection = document.querySelector(".registration"); // Adjust selector as needed
        if (registrationSection) {
          registrationSection.remove(); // Remove the element from the DOM
        }

        // Hide the login section
        const loginSection = document.querySelector(".login"); // Adjust selector as needed
        if (loginSection) {
          // loginSection.style.display = "none"; // Hide the login section
          loginSection.remove();
        }

        // Show welcome message with user's name
        // const welcomeMessage = document.createElement("div");
        const welcomeMessage = document.getElementById("welcomeContainer");
        welcomeContainer.innerHTML = `<h2>Welcome, ${result.first_name}!</h2>`;
        welcomeContainer.style.display = "block"; // Ensure it's visible

        // Show logout button
        const logoutButton = document.getElementById("logoutButton");
        if (logoutButton) {
          logoutButton.style.display = "block";
        }
        // Show auction block
        const auctionBlock = document.getElementById("auctionBlock");
        if (auctionBlock) {
          auctionBlock.style.display = "block";
        }
      } else {
        document.querySelector(".error-message").textContent = result.message;
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  });

export function logout() {
  console.log("Logout function called");
  // Remove authentication-related items from localStorage
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");

  // Call showLoginUI to handle UI changes
  showLoginUI();
}

function showLoginUI() {
  // Hide auction block
  console.log("showLoginUI function called");
  const auctionBlock = document.getElementById("auctionForm");
  if (auctionBlock) {
    auctionBlock.style.display = "none";
  }

  // Hide welcome message
  const welcomeContainer = document.getElementById("welcomeContainer");
  if (welcomeContainer) {
    welcomeContainer.style.display = "none";
  }

  // Hide logout button
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.style.display = "none";
  }

  // Show login section
  const loginSection = document.querySelector(".login");
  if (loginSection) {
    loginSection.style.display = "block";
  }

  // Show registration section if it exists
  const registrationSection = document.querySelector(".registration");
  if (registrationSection) {
    registrationSection.style.display = "block";
  }
}

async function makeAuthenticatedRequest(url, method = "GET", body = null) {
  const token = getValidToken();
  if (!token) {
    // Token is expired or not available
    alert("Your session has expired. Please log in again.");
    logout(); // Call your existing logout function
    return null;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      // Unauthorized, token might be invalid
      alert("Your session is invalid. Please log in again.");
      logout();
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error making authenticated request:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }
});

export { eventEmitter };
