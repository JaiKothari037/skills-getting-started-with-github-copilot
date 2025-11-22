document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Participants section HTML (no bullets, with delete icon)
          const participantsHtml = `
            <div class="participants-section" style="margin-top:14px; padding:10px; background:#eef6fa; border-radius:6px; border:1px solid #ddeaf6;">
              <strong style="color:#2d5c8a;">Participants:</strong>
              <div class="participants-list" style="margin:8px 0 0 18px; color:#444;">
                ${
                  details.participants.length > 0
                    ? details.participants.map(email => `
                        <span class="participant-item" style="display:flex;align-items:center;margin-bottom:6px;">
                          <span>${email}</span>
                          <button class="delete-participant-btn" title="Remove" data-activity="${name}" data-email="${email}" style="margin-left:8px; background:none; border:none; cursor:pointer; color:#c00; font-size:16px;">
                            &#128465;
                          </button>
                        </span>
                      `).join("")
                    : '<span style="font-style:italic;">No participants yet.</span>'
                }
              </div>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant delete (unregister)
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant-btn")) {
      const activityName = event.target.getAttribute("data-activity");
      const email = event.target.getAttribute("data-email");
      if (activityName && email) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          if (response.ok) {
            fetchActivities(); // Refresh list
          } else {
            alert("Failed to remove participant.");
          }
        } catch (err) {
          alert("Error removing participant.");
        }
      }
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
