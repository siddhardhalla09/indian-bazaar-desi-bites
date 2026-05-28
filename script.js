const CONFIG = window.ORDER_APP_CONFIG || {};

const BUSINESS = {
  phoneDigits: CONFIG.businessPhoneDigits || "15551234567",
  email: CONFIG.businessEmail || "orders@indianbazaar.example"
};

const STORAGE_KEY = CONFIG.localStorageKey || "indianBazaarOrders";
const orderItems = new Map();

const selectedItems = document.querySelector("#selected-items");
const orderForm = document.querySelector("#order-form");
const requestOutput = document.querySelector("#request-output");
const requestText = document.querySelector("#request-text");
const submissionStatus = document.querySelector("#submission-status");
const emailLink = document.querySelector("#email-request");
const whatsappLink = document.querySelector("#whatsapp-request");
const copyButton = document.querySelector("#copy-request");
const clearButton = document.querySelector("#clear-order");

function addItem(name, list) {
  const key = `${list}:${name}`;
  const existing = orderItems.get(key);
  const matchingType = list === "restaurant" ? "Restaurant pickup" : "Grocery pickup";
  const hasOtherList = Array.from(orderItems.values()).some((item) => item.list !== list);

  if (existing) {
    existing.quantity += 1;
  } else {
    orderItems.set(key, { name, list, quantity: 1 });
  }

  if (!hasOtherList) {
    const typeInput = orderForm.querySelector(`input[name="orderType"][value="${matchingType}"]`);
    typeInput.checked = true;
  }

  renderItems();
}

function changeQuantity(key, delta) {
  const item = orderItems.get(key);

  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    orderItems.delete(key);
  }

  renderItems();
}

function renderItems() {
  selectedItems.innerHTML = "";

  if (orderItems.size === 0) {
    selectedItems.innerHTML = '<li class="empty-state">Add grocery or restaurant items to start.</li>';
    return;
  }

  orderItems.forEach((item, key) => {
    const row = document.createElement("li");
    const itemName = document.createElement("span");
    const controls = document.createElement("span");
    const decrease = document.createElement("button");
    const count = document.createElement("span");
    const increase = document.createElement("button");

    itemName.textContent = item.name;
    controls.className = "item-controls";
    decrease.type = "button";
    increase.type = "button";
    decrease.setAttribute("aria-label", `Remove one ${item.name}`);
    increase.setAttribute("aria-label", `Add one ${item.name}`);
    decrease.textContent = "-";
    increase.textContent = "+";
    count.textContent = item.quantity;

    decrease.addEventListener("click", () => changeQuantity(key, -1));
    increase.addEventListener("click", () => changeQuantity(key, 1));

    controls.append(decrease, count, increase);
    row.append(itemName, controls);
    selectedItems.append(row);
  });
}

function getOrderItems() {
  return Array.from(orderItems.values()).map((item) => ({
    name: item.name,
    list: item.list,
    quantity: item.quantity
  }));
}

function getResolvedOrderType(selectedType, items) {
  const lists = new Set(items.map((item) => item.list));

  if (selectedType === "Catering inquiry") {
    return selectedType;
  }

  if (lists.has("grocery") && lists.has("restaurant")) {
    return "Mixed grocery and restaurant pickup";
  }

  if (lists.has("restaurant")) {
    return "Restaurant pickup";
  }

  if (lists.has("grocery")) {
    return "Grocery pickup";
  }

  return selectedType;
}

function getOrderPayload(formData) {
  const items = getOrderItems();
  const selectedType = formData.get("orderType");

  return {
    id: `IB-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "New",
    orderType: getResolvedOrderType(selectedType, items),
    customerName: formData.get("customerName").trim(),
    customerPhone: formData.get("customerPhone").trim(),
    pickupDate: formData.get("pickupDate") || "",
    pickupTime: formData.get("pickupTime") || "",
    notes: formData.get("notes")?.trim() || "",
    items
  };
}

function getOrderMessage(order) {
  const itemLines = order.items.map((item) => `- ${item.name} x ${item.quantity}`);

  return [
    "New order request",
    "",
    `Order ID: ${order.id}`,
    `Type: ${order.orderType}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Pickup date: ${order.pickupDate || "Not specified"}`,
    `Pickup time: ${order.pickupTime || "Not specified"}`,
    "",
    "Items:",
    itemLines.length ? itemLines.join("\n") : "- See notes",
    "",
    "Notes:",
    order.notes || "None",
    "",
    "Payment will be handled separately."
  ].join("\n");
}

function setSubmissionStatus(message, type) {
  submissionStatus.textContent = message;
  submissionStatus.className = `submission-status ${type ? `is-${type}` : ""}`;
}

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalOrder(order) {
  const orders = getLocalOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return order;
}

function jsonpRequest(action, params = {}) {
  if (!CONFIG.backendUrl) {
    return Promise.reject(new Error("Backend URL is not configured."));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `orderAppCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const url = new URL(CONFIG.backendUrl);

    url.searchParams.set("action", action);
    url.searchParams.set("callback", callbackName);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    window[callbackName] = (response) => {
      delete window[callbackName];
      script.remove();

      if (response && response.ok) {
        resolve(response);
      } else {
        reject(new Error(response?.error || "The order service returned an error."));
      }
    };

    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error("The order service could not be reached."));
    };

    script.src = url.toString();
    document.body.append(script);
  });
}

async function submitOrder(order) {
  if (!CONFIG.backendUrl) {
    return { ok: true, order: saveLocalOrder(order), localOnly: true };
  }

  const response = await jsonpRequest("create", {
    payload: JSON.stringify(order)
  });

  return { ok: true, order: response.order || order, localOnly: false };
}

async function prepareRequest(event) {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const notes = formData.get("notes")?.trim();

  if (orderItems.size === 0 && !notes) {
    requestOutput.hidden = false;
    requestText.textContent = "Please add at least one item or write the request in notes.";
    setSubmissionStatus("The request has not been sent yet.", "warning");
    return;
  }

  const order = getOrderPayload(formData);
  const message = getOrderMessage(order);
  const encodedSubject = encodeURIComponent(`${order.orderType} - ${order.customerName}`);
  const encodedBody = encodeURIComponent(message);

  requestText.textContent = message;
  requestOutput.hidden = false;
  emailLink.href = `mailto:${BUSINESS.email}?subject=${encodedSubject}&body=${encodedBody}`;
  whatsappLink.href = `https://wa.me/${BUSINESS.phoneDigits}?text=${encodedBody}`;
  setSubmissionStatus("Sending request...", "");

  try {
    const result = await submitOrder(order);

    if (result.localOnly) {
      setSubmissionStatus(
        "Demo mode: this order was saved in this browser. Add the Google Apps Script URL in config.js to send real orders to staff.",
        "warning"
      );
    } else {
      setSubmissionStatus("Order sent to the staff order manager.", "success");
      requestText.textContent = getOrderMessage(result.order);
    }
  } catch (error) {
    setSubmissionStatus(
      "The order manager could not be reached. The customer can still use Copy, Email, or WhatsApp below.",
      "error"
    );
  }
}

document.querySelectorAll(".add-item").forEach((button) => {
  button.addEventListener("click", () => {
    addItem(button.dataset.item, button.dataset.list);
  });
});

orderForm.addEventListener("submit", prepareRequest);

clearButton.addEventListener("click", () => {
  orderItems.clear();
  requestOutput.hidden = true;
  renderItems();
});

copyButton.addEventListener("click", async () => {
  const text = requestText.textContent.trim();

  if (!text) return;

  await navigator.clipboard.writeText(text);
  copyButton.classList.add("is-copied");
  copyButton.lastChild.textContent = " Copied";

  window.setTimeout(() => {
    copyButton.classList.remove("is-copied");
    copyButton.lastChild.textContent = " Copy";
  }, 1800);
});
