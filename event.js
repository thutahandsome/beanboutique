document.getElementById("registerForm").addEventListener("submit", function(e){
    e.preventDefault();

    const confirmation = document.getElementById("confirmationMessage");
    
    const first = document.getElementById("firstname").value;
    const last = document.getElementById("lastname").value;
    const email = document.getElementById("email").value;
    const number = document.getElementById("number").value;

    // Hide form
    form.style.display = "none";

    // Show confirmation
    confirmation.style.display = "block";

    // Clear form fields
    form.reset();

    const subject = encodeURIComponent("Event Registration Form");
    const body = encodeURIComponent(
      `First Name: ${first}\nLast Name: ${last}\nEmail: ${email}\nContact: ${number}`
    );

    // this triggers OS to open the app chooser if no default is set
    window.location.href = `mailto:youremail@example.com?subject=${subject}&body=${body}`;
}); 

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const registerButtons = document.querySelectorAll(".register_button_div a");

  registerButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault(); // stop default link behavior
      form.style.display = "block"; // show form
      form.scrollIntoView({ behavior: "smooth" }); // scroll smoothly
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("register_form_container");
  const registerButtons = document.querySelectorAll(".register_button_div a");
  const closeBtn = document.getElementById("closeModal");

  // Open modal when clicking Register Now
  registerButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "flex";
    });
  });

  // Close modal when clicking X
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside the form
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});


const pop = document.getElementById("register_form_container");
const closeButton = document.querySelector(".close");

// Close register form when clicking X
closeButton.onclick = () => {
  pop.style.display = "none";
};

// Close register form when clicking outside
window.onclick = (event) => {
  if (event.target == pop) {
    pop.style.display = "none";
  }
};

// Select elements
const form = document.getElementById("registerForm");
const clearBtn = document.querySelector(".clearbtn");

// Add event listener to clear button
clearBtn.addEventListener("click", () => {
  form.reset(); // clears all form fields
});

