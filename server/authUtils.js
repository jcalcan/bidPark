export function isTokenExpired(token) {
  if (!token) return true;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

export function getValidToken() {
  const token = localStorage.getItem("jwtToken");
  if (isTokenExpired(token)) {
    // Token is expired, clear it and return null
    localStorage.removeItem("jwtToken");
    return null;
  }
  return token;
}

export async function verifyTokenAndUpdateUI(token) {
  if (!token) {
    // No token found, show login UI
    showLoginUI();
    return; // Exit the function early
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      showAuthenticatedUI();
      return userData;
    } else {
      // Token is invalid
      showLoginUI();
      return null;
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    showLoginUI();
    return null;
  }
}

function showLoginUI() {
  const auctionBlock = document.getElementById("auctionBlock");
  const loginSection = document.querySelector(".login");
  const welcomeContainer = document.getElementById("welcomeContainer");
  const logoutButton = document.getElementById("logoutButton");

  if (auctionBlock) auctionBlock.style.display = "none";
  if (loginSection) loginSection.style.display = "block";
  if (welcomeContainer) welcomeContainer.style.display = "none";
  if (logoutButton) logoutButton.style.display = "none";
}

function showAuthenticatedUI() {
  const auctionBlock = document.getElementById("auctionBlock");
  const loginSection = document.querySelector(".login");
  const welcomeContainer = document.getElementById("welcomeContainer");
  const logoutButton = document.getElementById("logoutButton");
  const registrationSection = document.querySelector(".registration");

  if (registrationSection) registrationSection.style.display = "block";

  if (auctionBlock) auctionBlock.style.display = "block";
  if (loginSection) loginSection.style.display = "none";
  if (welcomeContainer) welcomeContainer.style.display = "block";
  if (logoutButton) logoutButton.style.display = "block";
}
