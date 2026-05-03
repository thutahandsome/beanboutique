// Animated Search Bar
let searchBarContainerEl = document.querySelector(".search_bar_container");
let magnifierEl = document.querySelector(".magnifier");
magnifierEl && magnifierEl.addEventListener("click", () => {
  searchBarContainerEl.classList.toggle("active");
});

// Show toast (uses your existing .toast and .toast.show CSS)
function showToast(message) {
  // ensure safe text
  const text = String(message == null ? "" : message);

  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast"; // uses your CSS .toast and .toast.show
    document.body.appendChild(toast);
  }

  // Clear any pending hide timer
  if (toast._hideTimer) {
    clearTimeout(toast._hideTimer);
    toast._hideTimer = null;
  }

  // Set message (use textContent to avoid HTML injection)
  toast.textContent = text;

  // Trigger show class (use RAF to ensure transition)
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto-hide after 3000ms
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove("show");
    // cleanup timer reference after transition; keep element for reuse
    toast._hideTimer = null;
  }, 3000);
}

// small helper to avoid injecting raw html from uncontrolled sources (kept in case you need)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------------------------
   Live search/filter for equipment cards + hide machines banner/headings during search
   --------------------------- */
(function () {
  const searchInput = document.querySelector('.search_bar_container .input');
  let cards = Array.from(document.querySelectorAll('.equipment_card'));
  const machinesBanner = document.querySelector('.machines_banner');

  const headings = Array.from(document.querySelectorAll('h1, h2, h3')).filter(h => {
    if (h.closest('.equipment_card') || h.closest('.equipment_info')) return false;
    return /(equipment|machine|machines|equipments)/i.test(h.textContent);
  });

  const equipmentsContainer = document.querySelector('.equipments_container');
  const noResultsEl = document.createElement('p');
  noResultsEl.textContent = 'No results found.';
  noResultsEl.className = 'no-results hidden';
  if (equipmentsContainer) {
    equipmentsContainer.parentNode.insertBefore(noResultsEl, equipmentsContainer.nextSibling);
  } else {
    document.body.appendChild(noResultsEl);
  }

  function normalize(str) {
    return String(str || '').toLowerCase().trim();
  }

  function filterCards(query) {
    const q = normalize(query);
    let anyVisible = false;

    if (q) {
      if (machinesBanner) machinesBanner.classList.add('hidden');
      headings.forEach(h => h.classList.add('hidden'));
    } else {
      if (machinesBanner) machinesBanner.classList.remove('hidden');
      headings.forEach(h => h.classList.remove('hidden'));
    }

    if (!q) {
      cards.forEach(card => card.classList.remove('hidden'));
      noResultsEl.classList.add('hidden');
      return;
    }

    cards.forEach(card => {
      const titleEl = card.querySelector('h2');
      const descEl = card.querySelector('.description');
      const title = titleEl ? titleEl.textContent : '';
      const desc = descEl ? descEl.textContent : card.textContent || '';
      const hay = normalize(title + ' ' + desc);

      if (hay.includes(q)) {
        card.classList.remove('hidden');
        anyVisible = true;
      } else {
        card.classList.add('hidden');
      }
    });

    if (!anyVisible) {
      noResultsEl.classList.remove('hidden');
    } else {
      noResultsEl.classList.add('hidden');
    }
  }

  function debounce(fn, delay = 160) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function refreshCards() {
    cards = Array.from(document.querySelectorAll('.equipment_card'));
  }

  if (searchInput) {
    const debounced = debounce((e) => {
      refreshCards();
      filterCards(e.target.value);
    }, 120);
    searchInput.addEventListener('input', debounced);

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        refreshCards();
        filterCards(searchInput.value);
        searchInput.blur();
      }
    });
  } else {
    console.warn('Search input not found: ".search_bar_container .input"');
  }

  const searchBarObserverRoot = document.querySelector(".search_bar_container");
  if (searchBarObserverRoot) {
    const observer = new MutationObserver(() => {
      if (!searchBarObserverRoot.classList.contains('active')) {
        if (searchInput) {
          searchInput.value = '';
          refreshCards();
          filterCards('');
        }
      }
    });
    observer.observe(searchBarObserverRoot, { attributes: true });
  }
})();

/* ---------------------------
   Cart logic + DOMContentLoaded
   --------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const formatMoney = (n) => Number(n).toFixed(2);
  const CART_KEY = "beanBoutiqueCart_v1";
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function updateCartCount() {
    const cartCountEl = document.getElementById("cart-count");
    if (!cartCountEl) return;
    let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  // coffee cards with quantity controls
  document.querySelectorAll(".coffee_card").forEach(card => {
    const countSpan = card.querySelector(".count");
    let count = parseInt(countSpan?.textContent) || 0;
    if (countSpan) countSpan.textContent = count;

    const plusBtn = card.querySelector(".plus");
    const minusBtn = card.querySelector(".minus");
    const addBtn = card.querySelector(".add_to_cart");

    plusBtn && plusBtn.addEventListener("click", () => {
      count++;
      if (countSpan) countSpan.textContent = count;
    });

    minusBtn && minusBtn.addEventListener("click", () => {
      if (count > 0) count--;
      if (countSpan) countSpan.textContent = count;
    });

    addBtn && addBtn.addEventListener("click", () => {
      const imgEl = card.querySelector(".card_img");
      const name = card.querySelector("h2")?.textContent.trim() || "Unknown";
      const priceText = card.querySelector("#price, .price")?.textContent || "";
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
      const quantity = parseInt(countSpan?.textContent) || 0;
      const image = imgEl ? imgEl.getAttribute("src") : "";

      if (quantity <= 0) {
        showToast("Please select a quantity before adding to cart.");
        return;
      }

      const prodId = name.toLowerCase().replace(/\s+/g, "-");
      const existing = cart.find(i => i.id === prodId);
      if (existing) {
        existing.qty += quantity;
      } else {
        cart.push({ id: prodId, name, price, qty: quantity, image });
      }

      saveCart();
      renderCart();
      updateCartCount();
      count = 0;
      if (countSpan) countSpan.textContent = 0;

      showToast(`${quantity} × ${name} added to cart.`);
    });
  });

  // machine cards — each click adds 1
  document.querySelectorAll(".equipment_card").forEach(card => {
    const addBtn = card.querySelector(".add_to_cart");

    addBtn && addBtn.addEventListener("click", () => {
      const imgEl = card.querySelector(".cart_img, .equipment_img img");
      const name = card.querySelector("h2")?.textContent.trim() || "Unknown";
      const priceText = card.querySelector(".price")?.textContent || "";
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
      const image = imgEl ? imgEl.getAttribute("src") : "";

      const prodId = name.toLowerCase().replace(/\s+/g, "-");
      const existing = cart.find(i => i.id === prodId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: prodId, name, price, qty: 1, image });
      }

      saveCart();
      renderCart();
      updateCartCount();

      showToast(`✅ ${name} added to cart.`);
    });
  });

  // render cart
  const cartBody = document.getElementById("cart_body");
  const cartTotalP = document.getElementById("cart_summary");

  function renderCart() {
    if (!cartBody) {
      updateCartCount();
      return;
    }

    cartBody.innerHTML = "";

    if (cart.length === 0) {
      cartBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:12px;">Your cart is empty.</td></tr>`;
      if (cartTotalP) cartTotalP.textContent = "Cart total: $0.00";
      updateCartCount();
      return;
    }

    let total = 0;
    cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${item.image}" alt="${item.name}" style="width:60px; height:auto; object-fit:cover; border-radius:6px;">
            <div>${item.name}</div>
          </div>
        </td>
        <td style="text-align:center;">$${formatMoney(item.price)}</td>
        <td style="text-align:center;">
          <input type="number" class="cart-qty" min="1" value="${item.qty}" style="width:60px; padding:4px;"/>
        </td>
        <td style="text-align:center;">$${formatMoney(itemTotal)}</td>
        <td style="text-align:center;">
          <button class="remove-item">Remove</button>
        </td>
      `;
      cartBody.appendChild(tr);
    });

    if (cartTotalP) cartTotalP.textContent = `Cart total: $${formatMoney(total)}`;
    updateCartCount();
  }

  // cart interactions
  document.addEventListener("change", (e) => {
    if (e.target.classList && e.target.classList.contains("cart-qty")) {
      const tr = e.target.closest("tr");
      const id = tr?.dataset?.id;
      let newQty = parseInt(e.target.value) || 1;
      if (newQty < 1) newQty = 1;
      e.target.value = newQty;

      const item = cart.find(i => i.id === id);
      if (item) {
        item.qty = newQty;
        saveCart();
        renderCart();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("remove-item")) {
      const tr = e.target.closest("tr");
      const id = tr?.dataset?.id;
      const removedItem = cart.find(i => i.id === id);
      cart = cart.filter(i => i.id !== id);
      saveCart();
      renderCart();
      if (removedItem) showToast(`${removedItem.name} removed from cart.`);
    }
  });

  // initial load
  renderCart();
  updateCartCount();
});