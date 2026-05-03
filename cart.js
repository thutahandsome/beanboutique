function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "beanBoutiqueCart_v1";
  const TAX_RATE = 0.07; // 7% tax
  const currency = (n) => Number(n).toFixed(2);

    // Coupon rules (replace your existing `coupons` const with this)
  const coupons = {
    // NEWYEAR20 is a percent coupon
    "NEWYEAR20": { type: "percent", value: 20 }
  };


  // Render order summary card values
  function calculateSummary() {
    let items = 0;
    let subtotal = 0;
    for (const it of cart) {
      items += it.qty;
      subtotal += (it.price * it.qty);
    }
    const tax = subtotal * TAX_RATE;

    let couponDiscount = 0;
    if (appliedCoupon) {
      const rule = coupons[appliedCoupon];
      if (rule) {
        // SPECIAL CASE: NEWYEAR20 should only discount eligible beans
        if (appliedCoupon === "NEWYEAR20") {
          // compute subtotal of eligible items only
          let eligibleSubtotal = 0;
          for (const it of cart) {
            const name = (it.name || "").toLowerCase();
            const isBean = ELIGIBLE_BEAN_KEYWORDS.some(k => name.includes(k));
            if (isBean) eligibleSubtotal += it.price * it.qty;
          }
          couponDiscount = eligibleSubtotal * (rule.value / 100);
        } else if (rule.type === "percent") {
          couponDiscount = subtotal * (rule.value / 100);
        } else if (rule.type === "fixed") {
          couponDiscount = rule.value;
        }
      }
      // never let discount exceed subtotal
      if (couponDiscount > subtotal) couponDiscount = subtotal;
    }

    let total = subtotal + tax - couponDiscount;
    if (total < 0) total = 0;

    return { items, subtotal, tax, couponDiscount, total };
  }


  // DOM refs
  const cartBody = document.getElementById("cart_body");
  const itemsCountEl = document.getElementById("summary_items");
  const subtotalEl = document.getElementById("summary_subtotal");
  const taxEl = document.getElementById("summary_tax");
  const couponInput = document.getElementById("coupon_input");
  const applyCouponBtn = document.getElementById("apply_coupon_btn");
  const couponMessageEl = document.getElementById("coupon_message");
  const couponDisplay = document.getElementById("summary_coupon");
  const totalEl = document.getElementById("summary_total");
  const taxRateDisplay = document.getElementById("tax_rate_display");
  const checkoutBtn = document.getElementById("checkout_btn");
  const cartCountEl = document.getElementById("cart-count"); // ✅ Badge

  // show tax rate
  if (taxRateDisplay) taxRateDisplay.textContent = `${Math.round(TAX_RATE * 100)}%`;

  // Load cart
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  let appliedCoupon = null;

  // Utilities
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // ✅ Update cart badge
  function updateCartCount() {
    if (!cartCountEl) return;
    let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  function calculateSummary() {
    let items = 0;
    let subtotal = 0;
    for (const it of cart) {
      items += it.qty;
      subtotal += (it.price * it.qty);
    }
    const tax = subtotal * TAX_RATE;

    let couponDiscount = 0;
    if (appliedCoupon) {
      const rule = coupons[appliedCoupon];
      if (rule) {
        if (rule.type === "percent") {
          couponDiscount = subtotal * (rule.value / 100);
        } else if (rule.type === "fixed") {
          couponDiscount = rule.value;
        }
      }
      if (couponDiscount > subtotal) couponDiscount = subtotal;
    }

    let total = subtotal + tax - couponDiscount;
    if (total < 0) total = 0;

    return { items, subtotal, tax, couponDiscount, total };
  }

  // Render cart table
  function renderCartTable() {
    if (!cartBody) return;
    cartBody.innerHTML = "";

    if (cart.length === 0) {
      cartBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:14px;">Your cart is empty.</td></tr>`;
      renderSummary();
      return;
    }

    cart.forEach(item => {
      const row = document.createElement("tr");
      row.dataset.id = item.id;
      row.innerHTML = `
        <td style="padding:10px; display:flex; gap:12px; align-items:center;">
          <img src="${item.image}" alt="${item.name}" style="width:70px; height:auto; object-fit:cover; border-radius:8px;">
          <div>
            <div style="font-weight:600; color:#3b2b26;">${item.name}</div>
            <div style="font-size:13px; color:#6f5d56;">$${currency(item.price)} each</div>
          </div>
        </td>
        <td style="text-align:center;">
          <input class="cart-qty-input" type="number" min="1" value="${item.qty}" style="width:64px; padding:6px; border-radius:6px; border:1px solid #ddd;">
        </td>
        <td style="text-align:center;">$${currency(item.price)}</td>
        <td style="text-align:center;">$${currency(item.price * item.qty)}</td>
        <td style="text-align:center;">
          <button class="remove-btn" style="padding:6px 8px; border-radius:8px; border:none; background:#d9534f; color:white; cursor:pointer;">Remove</button>
        </td>
      `;
      cartBody.appendChild(row);
    });

    renderSummary();
  }

  // Render order summary card values
  function renderSummary() {
    const s = calculateSummary();
    if (itemsCountEl) itemsCountEl.textContent = s.items;
    if (subtotalEl) subtotalEl.textContent = `$${currency(s.subtotal)}`;
    if (taxEl) taxEl.textContent = `$${currency(s.tax)}`;
    if (couponDisplay) couponDisplay.textContent = `-$${currency(s.couponDiscount)}`;
    if (totalEl) totalEl.textContent = `$${currency(s.total)}`;

    // update badge ✅
    updateCartCount();

    if (appliedCoupon) {
      couponMessageEl.textContent = `Coupon "${appliedCoupon}" applied.`;
      couponMessageEl.style.color = "#2a7a3a";
      couponInput.value = appliedCoupon;
      applyCouponBtn.textContent = "Remove";
    } else {
      couponMessageEl.textContent = "";
      couponMessageEl.style.color = "#7a6a64";
      applyCouponBtn.textContent = "Apply";
    }
  }

  // Event handlers
  document.addEventListener("change", (e) => {
    if (e.target && e.target.classList.contains("cart-qty-input")) {
      const tr = e.target.closest("tr");
      const id = tr?.dataset?.id;
      let value = parseInt(e.target.value) || 1;
      if (value < 1) value = 1;
      e.target.value = value;

      const item = cart.find(x => x.id === id);
      if (item) {
        item.qty = value;
        saveCart();
        renderCartTable();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("remove-btn")) {
      const tr = e.target.closest("tr");
      const id = tr?.dataset?.id;
      cart = cart.filter(x => x.id !== id);
      saveCart();
      renderCartTable();
    }
  });

  // Apply / remove coupon
  applyCouponBtn && applyCouponBtn.addEventListener("click", () => {
    const input = (couponInput?.value || "").trim().toUpperCase();
    if (!appliedCoupon) {
      if (!input) {
        couponMessageEl.textContent = "Please enter a coupon code.";
        couponMessageEl.style.color = "#b04b4b";
        return;
      }
      if (!coupons[input]) {
        couponMessageEl.textContent = "Coupon not recognized.";
        couponMessageEl.style.color = "#b04b4b";
        return;
      }
      appliedCoupon = input;
      renderSummary();
    } else {
      appliedCoupon = null;
      couponInput.value = "";
      renderSummary();
    }
  });
    
  checkoutBtn && checkoutBtn.addEventListener("click", () => {
    const summary = calculateSummary();
    if (cart.length === 0) {
      showToast("⚠️ Your cart is empty.");
      return;
    }

    // ✅ Show success popup instead of alert
    document.getElementById("orderSuccessPopup").style.display = "flex";
  });

  // Close popup button
  // Close popup and clear cart
  document.getElementById("closePopupBtn").addEventListener("click", () => {
    // Hide popup
    document.getElementById("orderSuccessPopup").style.display = "none";

    // Clear cart
    cart = [];
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    // Re-render UI
    if (typeof renderCartTable === "function") renderCartTable();
    if (typeof updateCartCount === "function") updateCartCount();
  });


  // Initial render
  renderCartTable();
});

const starsEl = document.querySelectorAll(".fa-star");
const emojisEl = document.querySelectorAll(".far");
const colorsArray = ["red", "orange", "lightblue", "lightgreen", "green"];

updateRating(0);

starsEl.forEach((starEl, index) => {
  starEl.addEventListener("click", () => {
    updateRating(index);
  });
});

function updateRating(index) {
  starsEl.forEach((starEl, idx) => {
    if (idx < index + 1) {
      starEl.classList.add("active");
    } else {
      starEl.classList.remove("active");
    }
  });

  emojisEl.forEach((emojiEl) => {
    emojiEl.style.transform = `translateX(-${index * 50}px)`;
    emojiEl.style.color = colorsArray[index];
  });
}