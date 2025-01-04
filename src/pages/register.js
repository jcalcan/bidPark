document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const firstName = document.getElementById("first_name").value;
    const lastName = document.getElementById("last_name").value;

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        document.getElementById("registrationForm").reset();
      } else {
        document.querySelector(".error-message").textContent = result.message;
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  });
