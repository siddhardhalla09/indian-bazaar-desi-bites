const CONFIG = window.ORDER_APP_CONFIG || {};
const STORAGE_KEY = CONFIG.localStorageKey || "indianBazaarOrders";

let orders = [];

const board = document.querySelector("#orders-board");
const template = document.querySelector("#order-card-template");
const statusFilter = document.querySelector("#status-filter");
const searchInput = document.querySelector("#order-search");
const adminKeyInput = document.querySelector("#admin-key");
const refreshButton = document.querySelector("#refresh-orders");
const adminStatus = document.querySelector("#admin-status");

const metrics = {
  New: document.querySelector("#metric-new"),
  active: document.querySelector("#metric-active"),
  done: document.querySelector("#metric-done"),
  cancelled: document.querySelector("#metric-cancelled")
};

function setStatus(message, type = "") {
  adminStatus.textContent = message;
  adminStatus.className = `admin-status ${type ? `is-${type}` : ""}`;
}

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalOrders(nextOrders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
}

function jsonpRequest(action, params = {}) {
  if (!CONFIG.backendUrl) {
    return Promise.reject(new Error("Backend URL is not configured."));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `adminOrderCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
        reject(new Error(response?.error || "Order service error."));
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

function normalizeOrder(order) {
  return {
    id: order.id || `IB-${Date.now().toString(36).toUpperCase()}`,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
    status: order.status || "New",
    orderType: order.orderType || "Pickup",
    customerName: order.customerName || "Customer",
    customerPhone: order.customerPhone || "",
    pickupDate: order.pickupDate || "",
    pickupTime: order.pickupTime || "",
    notes: order.notes || "",
    cancelReason: order.cancelReason || "",
    items: Array.isArray(order.items) ? order.items : []
  };
}

async function loadOrders() {
  if (!CONFIG.backendUrl) {
    orders = getLocalOrders().map(normalizeOrder);
    setStatus("Demo mode: showing orders saved in this browser.", "success");
    renderOrders();
    return;
  }

  const adminKey = adminKeyInput.value.trim();

  if (!adminKey) {
    orders = [];
    setStatus("Enter the admin key to load live orders.", "error");
    renderOrders();
    return;
  }

  setStatus("Loading orders...");

  try {
    const response = await jsonpRequest("list", { adminKey });
    orders = (response.orders || []).map(normalizeOrder);
    setStatus("Live orders loaded.", "success");
  } catch (error) {
    orders = [];
    setStatus(error.message, "error");
  }

  renderOrders();
}

function getFilteredOrders() {
  const status = statusFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  return orders.filter((order) => {
    const statusMatches = status === "All" || order.status === status;
    const searchText = [
      order.id,
      order.orderType,
      order.customerName,
      order.customerPhone,
      order.notes,
      ...order.items.map((item) => item.name)
    ].join(" ").toLowerCase();

    return statusMatches && (!query || searchText.includes(query));
  });
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatPickup(order) {
  const date = order.pickupDate || "No date";
  const time = order.pickupTime || "No time";
  return `${date} ${time}`;
}

function updateMetrics() {
  const newCount = orders.filter((order) => order.status === "New").length;
  const activeCount = orders.filter((order) => ["New", "Accepted", "Ready"].includes(order.status)).length;
  const doneCount = orders.filter((order) => order.status === "Completed").length;
  const cancelledCount = orders.filter((order) => order.status === "Cancelled").length;

  metrics.New.textContent = newCount;
  metrics.active.textContent = activeCount;
  metrics.done.textContent = doneCount;
  metrics.cancelled.textContent = cancelledCount;
}

function renderOrders() {
  board.innerHTML = "";
  updateMetrics();

  const filteredOrders = getFilteredOrders();

  if (filteredOrders.length === 0) {
    board.innerHTML = '<p class="empty-orders">No orders found.</p>';
    return;
  }

  filteredOrders.forEach((order) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const statusPill = card.querySelector(".status-pill");
    const itemsList = card.querySelector(".order-items");
    const notes = card.querySelector(".order-notes");
    const cancelReason = card.querySelector(".cancel-reason");

    card.dataset.status = order.status;
    card.querySelector(".order-id").textContent = order.id;
    card.querySelector("h2").textContent = order.customerName;
    statusPill.textContent = order.status;
    statusPill.dataset.status = order.status;
    card.querySelector(".order-phone").textContent = order.customerPhone || "Not set";
    card.querySelector(".order-pickup").textContent = formatPickup(order);
    card.querySelector(".order-type").textContent = order.orderType;
    card.querySelector(".order-created").textContent = formatDate(order.createdAt);

    itemsList.innerHTML = "";

    if (order.items.length === 0) {
      itemsList.innerHTML = "<li><span>See notes</span><strong></strong></li>";
    } else {
      order.items.forEach((item) => {
        const row = document.createElement("li");
        row.innerHTML = `<span>${item.name}</span><strong>x ${item.quantity}</strong>`;
        itemsList.append(row);
      });
    }

    notes.textContent = order.notes ? `Notes: ${order.notes}` : "Notes: none";
    cancelReason.textContent = order.cancelReason ? `Cancel reason: ${order.cancelReason}` : "";

    card.querySelectorAll(".order-actions button[data-status]").forEach((button) => {
      button.disabled = order.status === button.dataset.status;
      button.addEventListener("click", () => updateOrderStatus(order.id, button.dataset.status));
    });

    board.append(card);
  });
}

async function updateOrderStatus(orderId, nextStatus) {
  let cancelReason = "";

  if (nextStatus === "Cancelled") {
    cancelReason = window.prompt("Cancel reason", "") || "";
  }

  if (!CONFIG.backendUrl) {
    orders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: nextStatus, cancelReason, updatedAt: new Date().toISOString() }
        : order
    );
    saveLocalOrders(orders);
    setStatus(`Order ${orderId} marked ${nextStatus}.`, "success");
    renderOrders();
    return;
  }

  const adminKey = adminKeyInput.value.trim();

  if (!adminKey) {
    setStatus("Enter the admin key before changing live orders.", "error");
    return;
  }

  setStatus(`Updating ${orderId}...`);

  try {
    const response = await jsonpRequest("status", {
      adminKey,
      id: orderId,
      status: nextStatus,
      cancelReason
    });

    const updatedOrder = normalizeOrder(response.order);
    orders = orders.map((order) => (order.id === orderId ? updatedOrder : order));
    setStatus(`Order ${orderId} marked ${nextStatus}.`, "success");
    renderOrders();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

statusFilter.addEventListener("change", renderOrders);
searchInput.addEventListener("input", renderOrders);
adminKeyInput.addEventListener("change", loadOrders);
refreshButton.addEventListener("click", loadOrders);

loadOrders();
