const registrationForm = document.getElementById("registrationForm");

registrationForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const firstName = document.getElementById("first_name").value;
  const lastName = document.getElementById("last_name").value;
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.querySelector(".error-message");
  errorMessage.textContent = "";

  try {
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phoneNumber: phone
      })
    });

    const result = await response.json();
    if (response.status === 400 || response.status === 409) {
      const result = await response.json();
      if (result.userExists) {
        alert(result.message);
        // Hide registration form
        document.querySelector(".registration").style.display = "none";
        // Show login form
        document.querySelector(".login").style.display = "block";
        // Optionally, scroll to the login form
        document.querySelector(".login").scrollIntoView({ behavior: "smooth" });
        registrationForm.reset();
      }
    } else if (response.ok) {
      // Registration successful, now log in the user
      localStorage.setItem("jwtToken", result.token);
      localStorage.setItem("userId", result.userId);

      // Update UI
      toggleAuctionCreation(true);
      setupAuthenticatedUser(result.userId, result.userName);

      // Hide registration form, show auction creation form
      document.querySelector(".registration").style.display = "none";
      document.querySelector(".auction-creation").style.display = "block";

      // Optionally, hide login form
      document.querySelector(".login").style.display = "none";

      alert("Registration successful. You are now logged in.");
      document.getElementById("registrationForm").reset();
    } else {
      errorMessage.textContent = result.message;
    }
  } catch (error) {
    console.error("Error during registration:", error);
  }
});
