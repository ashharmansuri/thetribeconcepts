class TieredCart {
  constructor() {
    this.tiers = [
      { threshold: 10000, discount: 5, code: "TIER5" },
      { threshold: 20000, discount: 10, code: "TIER10" },
      { threshold: 30000, discount: 15, code: "TIER15" },
    ];
    this.cart = null;
    this.init();
  }

  async init() {
    await this.fetchCart();
    this.setupEventListeners();
    this.renderCart();
  }
  // Add this new method to your class
  async updateCartCount() {
    try {
      const response = await fetch(window.Shopify.routes.root + "cart.js");
      const cart = await response.json();
      const cartIconBubble = document.getElementById("cart-icon-bubble");

      if (cartIconBubble) {
        let cartCountBubble =
          cartIconBubble.querySelector(".cart-count-bubble");

        if (cart.item_count > 0) {
          if (!cartCountBubble) {
            cartCountBubble = document.createElement("div");
            cartCountBubble.className = "cart-count-bubble";
            cartCountBubble.innerHTML = `
              <span aria-hidden="true">${cart.item_count}</span>
              <span class="visually-hidden">${cart.item_count} items</span>
            `;
            cartIconBubble.appendChild(cartCountBubble);
          } else {
            const visibleCount = cartCountBubble.querySelector(
              "span[aria-hidden='true']"
            );
            const screenReaderCount =
              cartCountBubble.querySelector(".visually-hidden");

            if (visibleCount) visibleCount.textContent = cart.item_count;
            if (screenReaderCount) {
              screenReaderCount.textContent = `${cart.item_count} items`;
            }
          }
        } else if (cartCountBubble) {
          cartCountBubble.remove();
        }
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  async fetchCart() {
    try {
      const response = await fetch("/cart.js");
      this.cart = await response.json();
      return this.cart;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return null;
    }
  }

  setupEventListeners() {
    // Cart toggle events
    const cartIcon = document.getElementById("cart-icon-bubble");
    if (cartIcon) {
      cartIcon.addEventListener("click", () => this.toggleCart());
    }

    document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
      button.addEventListener("click", () => this.toggleCart());
    });

    // Close cart events
    document
      .querySelector(".cart-drawer__close")
      ?.addEventListener("click", () => this.closeCart());

    document.getElementById("cart-drawer")?.addEventListener("click", (e) => {
      if (e.target.id === "cart-drawer") this.closeCart();
    });

    // Add to cart events
    this.setupAddToCartListeners();

    // Cart item events (using event delegation)
    const cartContent = document.querySelector(".cart-drawer__content");
    if (cartContent) {
      cartContent.addEventListener("click", async (e) => {
        // Quantity decrease
        if (
          e.target.classList.contains("quantity-btn") &&
          e.target.classList.contains("minus")
        ) {
          const input = e.target.nextElementSibling;
          if (input.value > 1) {
            input.value = parseInt(input.value) - 1;
            await this.updateItemQuantity(input.dataset.key, input.value);
            await this.updateCartCount(); // Add this line
          }
        }

        // Quantity increase
        if (
          e.target.classList.contains("quantity-btn") &&
          e.target.classList.contains("plus")
        ) {
          const input = e.target.previousElementSibling;
          input.value = parseInt(input.value) + 1;
          await this.updateItemQuantity(input.dataset.key, input.value);
          await this.updateCartCount(); // Add this line
        }

        // Remove item (keep existing code)
        if (e.target.classList.contains("remove-item")) {
          e.preventDefault();
          await this.removeItem(e.target.dataset.key);
          await this.updateCartCount(); // Also add here for consistency
        }
      });

      cartContent.addEventListener("change", async (e) => {
        if (e.target.classList.contains("item-quantity")) {
          await this.updateItemQuantity(e.target.dataset.key, e.target.value);
          await this.updateCartCount(); // Add this line
        }
      });
    }

    // Checkout button
    document
      .querySelector(".checkout-button")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this.proceedToCheckout();
      });
  }

  setupAddToCartListeners() {
    document.querySelectorAll('[id^="add-to-cart-"]').forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.handleAddToCart(button);
      });
    });

    // Also listen for dynamic elements (if any)
    document.body.addEventListener("click", async (e) => {
      if (e.target.matches('[id^="add-to-cart-"]')) {
        e.preventDefault();
        await this.handleAddToCart(e.target);
      }
    });
  }

  async handleAddToCart(button) {
    const originalText = button.textContent;
    button.textContent = "Adding...";
    button.classList.add("add-to-cart-loading");

    try {
      const wrapper =
        button.closest(".single-product-button-wrapper") ||
        button.closest(".product-form");
      const variantInput =
        wrapper.querySelector('input[name="id"]') ||
        wrapper.querySelector('input[type="hidden"]');
      if (!variantInput) throw new Error("Variant ID not found");

      const variantId = variantInput.value;

      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to cart");
      }
      button.textContent = "Added!";
      await this.updateCartCount(); // Add this line
      await this.fetchCart();
      this.renderCart();
      this.openCart();

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("add-to-cart-loading");
      }, 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
      button.textContent = "Error - Try Again";
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("add-to-cart-loading");
      }, 2000);
    }
  }

  async updateItemQuantity(key, quantity) {
    if (quantity < 1) return;

    try {
      const itemElement = document
        .querySelector(`.item-quantity[data-key="${key}"]`)
        ?.closest(".cart-item");
      if (itemElement) {
        itemElement.classList.add("updating");
      }

      await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: key, quantity: parseInt(quantity) }),
      });

      await this.fetchCart();
      this.renderCart();
    } catch (error) {
      console.error("Error updating item:", error);
      const itemElement = document
        .querySelector(`.item-quantity[data-key="${key}"]`)
        ?.closest(".cart-item");
      if (itemElement) {
        itemElement.classList.remove("updating");
      }
    }
  }

  async removeItem(key) {
    try {
      // Show loading state on the item being removed
      const itemElement = document
        .querySelector(`.remove-item[data-key="${key}"]`)
        ?.closest(".cart-item");
      if (itemElement) {
        itemElement.classList.add("removing");
      }

      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: key, quantity: 0 }),
      });

      const cartData = await response.json();
      this.cart = cartData;

      // Check if item was actually removed
      const itemStillExists = this.cart.items.some((item) => item.key === key);
      if (!itemStillExists) {
        // Remove the item from DOM immediately while we wait for full render
        if (itemElement) {
          itemElement.remove();
        }
        await this.fetchCart();
        this.renderCart();
      } else {
        // If item still exists (removal failed), remove the loading state
        if (itemElement) {
          itemElement.classList.remove("removing");
        }
      }
    } catch (error) {
      console.error("Error removing item:", error);
      // Remove loading state if there was an error
      const itemElement = document
        .querySelector(`.remove-item[data-key="${key}"]`)
        ?.closest(".cart-item");
      if (itemElement) {
        itemElement.classList.remove("removing");
      }
    }
  }

  calculateDiscount() {
    const subtotal = this.cart.original_total_price;
    let applicableTier = null;
    let nextTier = null;

    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (subtotal >= this.tiers[i].threshold) {
        applicableTier = this.tiers[i];
        nextTier = i < this.tiers.length - 1 ? this.tiers[i + 1] : null;
        break;
      }
    }

    if (!applicableTier) {
      nextTier = this.tiers[0];
    }

    return {
      applicableTier,
      nextTier,
      discountAmount: applicableTier
        ? Math.round((subtotal * applicableTier.discount) / 100)
        : 0,
      progress: nextTier
        ? Math.min(100, (subtotal / nextTier.threshold) * 100)
        : 100,
      amountToNextTier: nextTier ? nextTier.threshold - subtotal : 0,
    };
  }

  renderCart() {
    if (!this.cart) return;

    const discountInfo = this.calculateDiscount();
    let itemsHTML = "";

    if (this.cart.items.length > 0) {
      this.cart.items.forEach((item) => {
        itemsHTML += `
          <div class="cart-item" data-variant-id="${item.variant_id}">
            <img src="${item.image}" alt="${item.title}" class="item-image">
            <div class="item-details">
              <h4>${item.title}</h4>
              <div class="item-price">${this.formatMoney(item.line_price)}</div>
              <div class="item-quantity-control">
                <button class="quantity-btn minus" data-key="${
                  item.key
                }">-</button>
                <input type="number" class="item-quantity" data-key="${
                  item.key
                }" value="${item.quantity}" min="1">
                <button class="quantity-btn plus" data-key="${
                  item.key
                }">+</button>
              </div>
            </div>
            <button class="remove-item" data-key="${item.key}">Remove</button>
          </div>
        `;
      });
    } else {
      itemsHTML = '<p class="empty-cart">Your cart is empty</p>';
    }

    const cartItemsContainer = document.querySelector(".cart-items");
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = itemsHTML;
    }

    const progressFill = document.querySelector(".progress-fill");
    if (progressFill) {
      progressFill.style.width = `${discountInfo.progress}%`;
    }

    const progressContainer = document.querySelector(".discount-progress");
    if (this.cart.items.length === 0) {
      progressContainer?.classList.add("hidden");
    } else {
      progressContainer?.classList.remove("hidden");
    }

    let messagesHTML = "";
    if (discountInfo.applicableTier) {
      messagesHTML += `<p class="current-tier">You've unlocked ${discountInfo.applicableTier.discount}% off with code: <strong>${discountInfo.applicableTier.code}</strong></p>`;
    }

    if (discountInfo.nextTier) {
      messagesHTML += `<p class="next-tier">Spend ${this.formatMoney(
        discountInfo.amountToNextTier
      )} more to get ${discountInfo.nextTier.discount}% off!</p>`;
    } else {
      messagesHTML += `<p class="max-tier">You've reached the maximum discount!</p>`;
    }

    const tierMessagesContainer = document.querySelector(".tier-messages");
    if (tierMessagesContainer) {
      tierMessagesContainer.innerHTML = messagesHTML;
    }

    // Update totals
    const subtotalElement = document.querySelector(".subtotal-amount");
    const discountElement = document.querySelector(".discount-amount");
    const totalElement = document.querySelector(".total-amount");

    if (subtotalElement) {
      subtotalElement.textContent = this.formatMoney(
        this.cart.original_total_price
      );
    }
    if (discountElement) {
      discountElement.textContent = `-${this.formatMoney(
        discountInfo.discountAmount
      )}`;
    }
    if (totalElement) {
      totalElement.textContent = this.formatMoney(
        this.cart.original_total_price - discountInfo.discountAmount
      );
    }

    this.updateCheckoutButton(discountInfo);
  }

  updateCheckoutButton(discountInfo) {
    const checkoutBtn = document.querySelector(".checkout-button");
    if (checkoutBtn) {
      if (discountInfo.applicableTier) {
        checkoutBtn.setAttribute(
          "data-discount-code",
          discountInfo.applicableTier.code
        );
      } else {
        checkoutBtn.removeAttribute("data-discount-code");
      }
    }
  }

  formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  toggleCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.classList.toggle("open");
      document.body.classList.toggle("cart-open");
    }
  }

  openCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.classList.add("open");
      document.body.classList.add("cart-open");
    }
  }

  closeCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.classList.remove("open");
      document.body.classList.remove("cart-open");
    }
  }

  storeDiscountCode(code) {
    if (code) {
      sessionStorage.setItem("tiered_discount_code", code);
      sessionStorage.setItem(
        "tiered_discount_timestamp",
        Date.now().toString()
      );
    }
  }

  getStoredDiscountCode() {
    const code = sessionStorage.getItem("tiered_discount_code");
    const timestamp = sessionStorage.getItem("tiered_discount_timestamp");
    if (code && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < 10 * 60 * 1000) return code;
      sessionStorage.removeItem("tiered_discount_code");
      sessionStorage.removeItem("tiered_discount_timestamp");
    }
    return null;
  }

  async proceedToCheckout() {
    if (this.cart.items.length === 0) return;

    const checkoutBtn = document.querySelector(".checkout-button");
    if (!checkoutBtn) return;

    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = "Processing...";
    checkoutBtn.disabled = true;

    try {
      const discountInfo = this.calculateDiscount();
      if (discountInfo.applicableTier) {
        this.storeDiscountCode(discountInfo.applicableTier.code);
        window.location.href = `/checkout?discount=${encodeURIComponent(
          discountInfo.applicableTier.code
        )}`;
      } else {
        window.location.href = "/checkout";
      }
    } catch (error) {
      console.error("Checkout error:", error);
      window.location.href = "/checkout";
    } finally {
      setTimeout(() => {
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
      }, 100);
    }
  }

  static applyStoredDiscountOnCheckout() {
    const tieredCart = new TieredCart();
    const discountCode = tieredCart.getStoredDiscountCode();
    if (discountCode && window.Shopify && window.Shopify.checkout) {
      try {
        const discountField =
          document.querySelector('input[name="discount"]') ||
          document.querySelector("#discount-code") ||
          document.querySelector("[data-discount-field]");

        if (discountField) {
          discountField.value = discountCode;
          const applyButton =
            document.querySelector("[data-discount-apply]") ||
            document.querySelector(".discount-apply") ||
            discountField
              .closest("form")
              ?.querySelector('button[type="submit"]');

          if (applyButton) applyButton.click();
        }

        sessionStorage.removeItem("tiered_discount_code");
        sessionStorage.removeItem("tiered_discount_timestamp");
      } catch (error) {
        console.error("Error applying discount code:", error);
      }
    }
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const tieredCart = new TieredCart();
  window.tieredCart = tieredCart;

  if (window.location.pathname.includes("/checkout")) {
    setTimeout(() => {
      TieredCart.applyStoredDiscountOnCheckout();
    }, 1000);
  }
});
