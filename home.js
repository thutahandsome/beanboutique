  // Slideshow with interactive prev/next and dots + auto-advance
  (function () {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");

    let slideIndex = 1;           // 1-based index for easier mapping to dots/slides
    const intervalMs = 3000;      // auto-advance interval (ms)
    let slideTimer = null;

    // Show slide with wrapping and update dots
    function showSlide(n) {
      const total = slides.length;
      if (total === 0) return;

      // wrap
      if (n > total) n = 1;
      if (n < 1) n = total;
      slideIndex = n;

      // hide all slides
      for (let i = 0; i < total; i++) {
        slides[i].style.display = "none";
      }

      // remove active class from all dots
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
        // ensure dots are keyboard accessible as buttons
        dots[i].setAttribute("role", "button");
        dots[i].setAttribute("tabindex", "0");
      }

      // show current slide and mark dot active (if exists)
      slides[slideIndex - 1].style.display = "block";
      if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
      }
    }

    // Move relative by n (e.g., +1 / -1)
    function plusSlides(n) {
      showSlide(slideIndex + n);
      restartTimer();
    }

    // Jump to a specific slide (1-based)
    function currentSlide(n) {
      showSlide(n);
      restartTimer();
    }

    // Auto-advance using setInterval
    function startTimer() {
      stopTimer();
      slideTimer = setInterval(() => {
        showSlide(slideIndex + 1);
      }, intervalMs);
    }

    function stopTimer() {
      if (slideTimer !== null) {
        clearInterval(slideTimer);
        slideTimer = null;
      }
    }

    // Restart timer after user interaction
    function restartTimer() {
      startTimer();
    }

    // Hook up prev/next buttons (if present)
    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault?.();
        slides(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault?.();
        slides(1);
      });
    }

    // Hook up dots (they are zero-indexed in DOM, slides are 1-based)
    Array.from(dots).forEach((dot, idx) => {
      dot.addEventListener("click", () => currentSlide(idx + 1));
      // keyboard accessibility: Enter/Space also trigger
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          currentSlide(idx + 1);
        }
      });
    });

    // Initialize first slide and start auto-advance
    showSlide(slideIndex);
    startTimer();

    // Optional: pause on hover, resume on leave
    const slideshowContainer = document.querySelector(".slideshow-container");
    if (slideshowContainer) {
      slideshowContainer.addEventListener("mouseenter", stopTimer);
      slideshowContainer.addEventListener("mouseleave", startTimer);
    }

    // Expose functions to global scope if your HTML uses inline onclick handlers
    // (your HTML currently uses plusSlides(...) and currentSlide(...))
    window.plusSlides = plusSlides;
    window.currentSlide = currentSlide;
  })();



// Pop-up
const pop = document.getElementById("pop");
const closeButton = document.querySelector(".close_button");

// Show Pop-up only if user hasn't signed up in this session
window.onload = () => {
  const hasSignedUp = sessionStorage.getItem("hasSignedUp");

  if (!hasSignedUp) {
    setTimeout(() => {
      pop.style.display = "flex";
    }, 2000);
  }
};


// Close Pop-up when clicking X
closeButton.onclick = () => {
  pop.style.display = "none";
};

// Close Pop-up when clicking outside
window.onclick = (event) => {
  if (event.target == pop) {
    pop.style.display = "none";
  }
};

// ✅ Update cart count badge
  function updateCartCount() {
    const cartCountEl = document.getElementById("cart-count");
    if (!cartCountEl) return;

    let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

// Cache popup elements
const popup = document.getElementById("pop");
const successPop = document.getElementById("successPop");
const signupBtn = document.querySelector("#pop button[type='submit']");
const signupEmail = document.getElementById("signupEmail");
const signupMessage = document.getElementById("signupMessage");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");

// 1) Close any popup when its own `.close_button` is clicked.
//    This will work even if you have more popups added later.
document.querySelectorAll(".pop .close_button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const popEl = e.currentTarget.closest(".pop");
    if (popEl) popEl.style.display = "none";
  });
});

// 2) Explicit handler for the "Close" button inside the success popup
if (closeSuccessBtn) {
  closeSuccessBtn.addEventListener("click", () => {
    successPop.style.display = "none";
  });
}

// 3) Clicking outside a popup closes *that* popup (works for both popups)
window.addEventListener("click", (event) => {
  // Use strict equality to avoid accidental truthy checks
  if (event.target === popup) {
    popup.style.display = "none";
  }
  if (event.target === successPop) {
    successPop.style.display = "none";
  }
});

// 4) Sign up logic (keeps your logic but uses variables above)

if (signupBtn) {
  signupBtn.addEventListener("click", function (e) {
    e.preventDefault && e.preventDefault();

    const email = signupEmail.value.trim();

    // Clear previous messages
    signupMessage.textContent = "";
    signupMessage.style.color = "";

    if (email === "") {
      signupMessage.textContent = "Please enter your email.";
      signupMessage.style.color = "red";
      return;
    }

    // simple gmail check (endsWith is fine here)
    const isGmail = email.toLowerCase().endsWith("@gmail.com");

    if (!isGmail) {
      signupMessage.textContent = "❌ Invalid email. Please enter a valid Gmail address.";
      signupMessage.style.color = "red";
      return;
    }

    // Check fake reCAPTCHA state (uses the `isChecked` variable from your recaptcha code)
    if (!isChecked) {
      // show the validation message directly under the sign up button
      signupMessage.textContent = "⚠️ Please validate you are not a robot.";
      signupMessage.style.color = "orange";
      // Optionally move focus to the recaptcha box for accessibility
      const box = document.getElementById('recaptcha-box');
      if (box) box.focus && box.focus();
      return;
    }

    // If we get here: email OK and reCAPTCHA checked
    if (popup) popup.style.display = "none";
    if (successPop) successPop.style.display = "flex";

    // Mark as signed up (so popup won’t show again until reload)
    sessionStorage.setItem("hasSignedUp", "true");
  });
}


const box = document.getElementById('recaptcha-box');
    const checkbox = document.getElementById('recaptcha-checkbox');

    let isChecked = false;
    box.addEventListener('click', () => {
      if (isChecked || checkbox.classList.contains('loading')) return;
      checkbox.classList.add('loading');
      setTimeout(() => {
        checkbox.classList.remove('loading');
        checkbox.classList.add('checked');
        isChecked = true;
      }, 3000); // 3 seconds
    });

let count = 0; // Initialize the counter variable

// Get references to the HTML elements
let counterDisplay = document.getElementById('counter-display');
let incrementBtn = document.getElementById('increment-btn');
let decrementBtn = document.getElementById('decrement-btn');
let resetBtn = document.getElementById('reset-btn');

// Update the display with the current count
function updateDisplay() {
  counterDisplay.textContent = count;
}

// Event listeners for button clicks
incrementBtn.addEventListener('click', () => {
  count++;
  updateDisplay();
});

decrementBtn.addEventListener('click', () => {
  count--;
  updateDisplay();
});

resetBtn.addEventListener('click', () => {
  count = 0;
  updateDisplay();
});

// Initial display update
updateDisplay();

// Sign Up
function sign_up(){
}

const carousel = document.querySelector(".products_container");
const cardWidth = 240; // card width + margin
let scrollAmount = 0;

function autoSlide() {
  scrollAmount += cardWidth;

  if (scrollAmount >= carousel.scrollWidth - carousel.parentElement.offsetWidth) {
    scrollAmount = 0; // reset to start
  }

  carousel.style.transform = `translateX(-${scrollAmount}px)`;
}

setInterval(autoSlide, 2500); // change slide every 2.5s

  (function () {
    const hamburger = document.querySelector('.navbar .hamburger');
    const mainNav = document.getElementById('main-nav');

    if (!hamburger || !mainNav) return;

    // Toggle function
    function setOpen(isOpen) {
      hamburger.classList.toggle('open', isOpen);
      mainNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = hamburger.classList.contains('open');
      setOpen(!isOpen);
    });

    // Close when clicking a link (mobile)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 768px)').matches) {
          setOpen(false);
        }
      });
    });

    // Close when clicking outside navbar
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar')) {
        setOpen(false);
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Optional: keep nav closed when resizing to desktop
    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 768px)').matches) {
        setOpen(false);
      }
    });
  })();