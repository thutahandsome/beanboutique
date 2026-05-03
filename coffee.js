(function () {
  // --- Utilities & config ---
  const CART_KEY = "beanBoutiqueCart_v1";
  const formatMoney = (n) => Number(n).toFixed(2);
  const qs = (sel, ctx = document) => ctx.querySelector(sel);

  // load cart from canonical key (returns array)
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY) || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // save cart to canonical key
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }

  function getCart() {
    return loadCart();
  }
  function setCart(c) {
    saveCart(c);
  }

  // Show toast (keeps your original behavior)
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // --- Unified cart badge updater (single authoritative function) ---
  function updateCartCount(value) {
    const el = document.getElementById("cart-count");
    if (!el) return 0;

    let count = 0;

    if (typeof value === "number") {
      count = Math.max(0, Math.floor(value));
    } else {
      // read from canonical storage
      const stored = loadCart();
      count = stored.reduce((sum, item) => {
        const q = item?.qty ?? item?.quantity ?? 0;
        const n = Number.isFinite(+q) ? Math.max(0, Math.floor(+q)) : 0;
        return sum + n;
      }, 0);
    }

    el.textContent = String(count);

    // Pulse animation (if CSS defines .pulse). Add & remove once.
    if (!el.classList.contains("pulse")) {
      el.classList.add("pulse");
      el.addEventListener("animationend", () => el.classList.remove("pulse"), { once: true });
    }

    return count;
  }

  // Expose updateCartCount globally for any inline or other scripts
  window.updateCartCount = updateCartCount;
  window.getCart = getCart;
  window.setCart = setCart;

  // --- Main DOMContentLoaded: wires up everything you had ---
  document.addEventListener("DOMContentLoaded", () => {
    // local in-memory cart for page operations (keeps in sync with storage)
    let cart = loadCart();

    // Save helper that refreshes storage and UI
    function persistCart() {
      saveCart(cart);
      renderCart();
      updateCartCount();
    }

    // --- Add-to-cart controls on each .coffee_card ---
    document.querySelectorAll(".coffee_card").forEach((card) => {
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
        const nameEl = card.querySelector("h2");
        const priceEl = card.querySelector("#price") || card.querySelector(".price");

        const name = nameEl ? nameEl.textContent.trim() : "Unknown";
        const priceText = priceEl ? priceEl.textContent : "";
        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
        const quantity = parseInt(countSpan?.textContent) || 0;
        const image = imgEl ? imgEl.getAttribute("src") : "";

        if (quantity <= 0) {
          showToast("⚠️ Please select a quantity before adding to cart.");
          return;
        }

        const prodId = name.toLowerCase().replace(/\s+/g, "-");

        const existing = cart.find((i) => i.id === prodId);
        if (existing) {
          existing.qty = (existing.qty || existing.quantity || 0) + quantity;
        } else {
          // store using `qty` as canonical item quantity field
          cart.push({ id: prodId, name, price, qty: quantity, image });
        }

        persistCart();

        // reset quantity shown on the card
        count = 0;
        if (countSpan) countSpan.textContent = 0;

        // small toast & done
        showToast("✅ Added to cart");
      });
    }); // end each .coffee_card

    // --- Render cart table on cart page ---
    const cartBody = document.getElementById("cart_body");
    const cartTotalP = document.getElementById("cart_summary");

    function renderCart() {
      // re-sync local cart from storage (in case other tab/script changed it)
      cart = loadCart();

      if (!cartBody) {
        updateCartCount();
        return;
      }

      cartBody.innerHTML = "";

      if (!cart || cart.length === 0) {
        cartBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:12px;">Your cart is empty.</td></tr>`;
        if (cartTotalP) cartTotalP.textContent = "Cart total: $0.00";
        updateCartCount();
        return;
      }

      let total = 0;
      cart.forEach((item) => {
        const qty = item.qty ?? item.quantity ?? 0;
        const itemTotal = (item.price || 0) * qty;
        total += itemTotal;

        const tr = document.createElement("tr");
        tr.dataset.id = item.id;
        tr.innerHTML = `
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${item.image || ''}" alt="${item.name || ''}" style="width:60px; height:auto; object-fit:cover; border-radius:6px;">
              <div>${item.name || ''}</div>
            </div>
          </td>
          <td style="text-align:center;">$${formatMoney(item.price)}</td>
          <td style="text-align:center;">
            <input type="number" class="cart-qty" min="1" value="${qty}" style="width:60px; padding:4px;"/>
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

    // Handle qty input changes in cart page
    document.addEventListener("change", (e) => {
      if (e.target.classList && e.target.classList.contains("cart-qty")) {
        const tr = e.target.closest("tr");
        const id = tr?.dataset?.id;
        let newQty = parseInt(e.target.value) || 1;
        if (newQty < 1) newQty = 1;
        e.target.value = newQty;

        const item = cart.find((i) => i.id === id);
        if (item) {
          // write using canonical `qty`
          item.qty = newQty;
          saveCart(cart);
          renderCart();
        }
      }
    });

    // Handle remove button in cart page
    document.addEventListener("click", (e) => {
      if (e.target.classList && e.target.classList.contains("remove-item")) {
        const tr = e.target.closest("tr");
        const id = tr?.dataset?.id;
        cart = cart.filter((i) => i.id !== id);
        saveCart(cart);
        renderCart();
        showToast("Removed from cart");
      }
    });

    // Initial render for cart page
    renderCart();

    // Ensure badge is correct on first load
    updateCartCount();

    // --- Search bar toggle ---
    const searchBarContainerEl = document.querySelector(".search_bar_container");
    const magnifierEl = document.querySelector(".magnifier");
    if (magnifierEl && searchBarContainerEl) {
      magnifierEl.addEventListener("click", () => {
        searchBarContainerEl.classList.toggle("active");
      });
    }

    // --- Search + filter for coffee cards + hide headings during search ---
    (function setupSearchFilter() {
      const searchInput = document.querySelector(".search_bar_container .input");
      const cards = Array.from(document.querySelectorAll(".coffee_card"));
      const headings = Array.from(document.querySelectorAll("h1, h2, h3")).filter((h) =>
        /(drinks|bean)/i.test(h.textContent)
      );
      const menuContainers = Array.from(document.querySelectorAll(".menu_container"));

      const noResultsEl = document.createElement("p");
      noResultsEl.textContent = "No results found.";
      noResultsEl.className = "no-results hidden";
      noResultsEl.style.textAlign = "center";
      noResultsEl.style.marginTop = "12px";
      noResultsEl.style.fontStyle = "italic";
      noResultsEl.style.color = "#555";

      if (menuContainers.length) {
        const lastMenu = menuContainers[menuContainers.length - 1];
        lastMenu.parentNode.insertBefore(noResultsEl, lastMenu.nextSibling);
      } else {
        document.body.appendChild(noResultsEl);
      }

      function normalize(str) {
        return String(str || "").toLowerCase().trim();
      }

      function filterCards(query) {
        const q = normalize(query);
        let anyVisible = false;

        if (q) headings.forEach((h) => h.classList.add("hidden"));
        else headings.forEach((h) => h.classList.remove("hidden"));

        if (!q) {
          cards.forEach((card) => card.classList.remove("hidden"));
          noResultsEl.classList.add("hidden");
          return;
        }

        cards.forEach((card) => {
          const titleEl = card.querySelector("h2");
          const title = titleEl ? titleEl.textContent : "";
          const bodyText = card.textContent || "";
          const hay = normalize(title + " " + bodyText);

          if (hay.includes(q)) {
            card.classList.remove("hidden");
            anyVisible = true;
          } else {
            card.classList.add("hidden");
          }
        });

        if (!anyVisible) noResultsEl.classList.remove("hidden");
        else noResultsEl.classList.add("hidden");
      }

      function debounce(fn, delay = 180) {
        let t;
        return function (...args) {
          clearTimeout(t);
          t = setTimeout(() => fn.apply(this, args), delay);
        };
      }

      if (searchInput) {
        const debouncedFilter = debounce((e) => filterCards(e.target.value), 120);
        searchInput.addEventListener("input", debouncedFilter);

        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            filterCards(searchInput.value);
            searchInput.blur();
          }
        });
      }

      // Reset on close of search bar
      if (searchBarContainerEl) {
        const observer = new MutationObserver(() => {
          if (!searchBarContainerEl.classList.contains("active")) {
            if (searchInput) {
              searchInput.value = "";
              filterCards("");
            }
          }
        });
        observer.observe(searchBarContainerEl, { attributes: true });
      }
    })();

    // --- Filter buttons (category) ---
    (function setupFilters() {
      const buttons = Array.from(document.querySelectorAll(".filter_btn"));
      const cards = Array.from(document.querySelectorAll(".coffee_card"));

      function applyFilter(filter) {
        cards.forEach((card) => {
          const cat = (card.dataset.category || "").trim().toLowerCase();
          if (filter === "all") {
            card.classList.remove("hidden");
          } else {
            const tokens = cat.split(/\s+/);
            if (tokens.includes(filter)) card.classList.remove("hidden");
            else card.classList.add("hidden");
          }
        });
      }

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active1"));
          btn.classList.add("active1");
          const filter = (btn.dataset.filter || "all").toLowerCase();
          applyFilter(filter);
        });
        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            btn.click();
          }
        });
      });

      applyFilter("all");
    })();

    // --- Hamburger nav behavior ---
    (function setupNav() {
      const hamburger = document.querySelector(".navbar .hamburger");
      const mainNav = document.getElementById("main-nav");

      if (!hamburger || !mainNav) return;

      function setOpen(isOpen) {
        hamburger.classList.toggle("open", isOpen);
        mainNav.classList.toggle("open", isOpen);
        hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }

      hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = hamburger.classList.contains("open");
        setOpen(!isOpen);
      });

      mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          if (window.matchMedia("(max-width: 768px)").matches) setOpen(false);
        });
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest(".navbar")) setOpen(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
      });

      window.addEventListener("resize", () => {
        if (!window.matchMedia("(max-width: 768px)").matches) setOpen(false);
      });
    })();

    // --- Favourite heart toggle ---
    (function initFavButtons() {
      const favButtons = Array.from(document.querySelectorAll(".fav"));
      if (!favButtons.length) return;

      const useShowToast = typeof showToast === "function";
      function fallbackToast(msg, ms = 2200) {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(t._fadeTimeout);
        t._fadeTimeout = setTimeout(() => t.classList.remove("show"), ms);
      }
      const toastFn = useShowToast ? showToast : fallbackToast;

      favButtons.forEach((btn) => {
        btn.setAttribute("role", "button");
        const icon = btn.querySelector("i");
        const isSolid = icon && icon.classList.contains("fa-solid");
        btn.setAttribute("aria-pressed", String(!!isSolid));
        if (isSolid) btn.classList.add("is-favourite");

        function toggleFav() {
          const currentlyFav = btn.getAttribute("aria-pressed") === "true";
          const newState = !currentlyFav;
          btn.setAttribute("aria-pressed", String(newState));
          if (icon) {
            icon.classList.remove("fa-regular", "fa-solid");
            icon.classList.add(newState ? "fa-solid" : "fa-regular");
          }
          btn.classList.toggle("is-favourite", newState);
          if (newState) {
            toastFn("❤️ Added to favourite list");
          } else {
            toastFn("Removed from favourite list");
          }
        }

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleFav();
        });
        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFav();
          }
        });
      });
    })();

    // --- Other product API that used dataset-based product cards (backwards compatibility) ---
    (function productDatasetHandlers() {
      // If there are elements with class .product (older code), wire them to the unified cart storage
      const prods = Array.from(document.querySelectorAll(".product"));
      if (!prods.length) return;

      prods.forEach((prod) => {
        let quantity = 1;
        const qtyEl = prod.querySelector(".quantity");
        const plusBtn = prod.querySelector(".plus");
        const minusBtn = prod.querySelector(".minus");
        const addBtn = prod.querySelector(".add_to_cart");

        const prodId = prod.dataset.id;
        function syncCartQuantityInStorage(newQty) {
          let c = loadCart();
          const idx = c.findIndex((it) => it.id == prodId);
          if (idx > -1) {
            c[idx].qty = newQty;
            saveCart(c);
          }
        }

        plusBtn && (plusBtn.onclick = () => {
          quantity++;
          if (qtyEl) qtyEl.textContent = quantity;
          syncCartQuantityInStorage(quantity);
          updateCartCount();
        });

        minusBtn && (minusBtn.onclick = () => {
          if (quantity > 1) quantity--;
          if (qtyEl) qtyEl.textContent = quantity;
          syncCartQuantityInStorage(quantity);
          updateCartCount();
        });

        addBtn && (addBtn.onclick = () => {
          const id = prod.dataset.id;
          const name = prod.dataset.name;
          const price = parseFloat(prod.dataset.price) || 0;
          let c = loadCart();
          const idx = c.findIndex((item) => item.id == id);
          if (idx > -1) {
            c[idx].qty = (c[idx].qty || c[idx].quantity || 0) + quantity;
          } else {
            c.push({ id, name, price, qty: quantity });
          }
          saveCart(c);
          updateCartCount();
          showToast("✅ Added to cart");
        });
      });
    })();

    // end DOMContentLoaded
  }); // end main DOMContentLoaded

  // Extra safety: ensure badge is correct on full window load (in case of multiple script order)
  window.addEventListener("load", () => {
    updateCartCount();
  });
})();
