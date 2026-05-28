const BUSINESS = {
  phoneDigits: "15551234567",
  email: "orders@indianbazaar.example"
};

const orderItems = new Map();

const selectedItems = document.querySelector("#selected-items");
const orderForm = document.querySelector("#order-form");
const requestOutput = document.querySelector("#request-output");
const requestText = document.querySelector("#request-text");
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

function getOrderMessage(formData) {
  const itemLines = Array.from(orderItems.values()).map((item) => `- ${item.name} x ${item.quantity}`);
  const notes = formData.get("notes")?.trim();
  const pickupDate = formData.get("pickupDate") || "Not specified";
  const pickupTime = formData.get("pickupTime") || "Not specified";
  const selectedType = formData.get("orderType");
  const lists = new Set(Array.from(orderItems.values()).map((item) => item.list));
  let resolvedType = selectedType;

  if (selectedType !== "Catering inquiry") {
    if (lists.has("grocery") && lists.has("restaurant")) {
      resolvedType = "Mixed grocery and restaurant pickup";
    } else if (lists.has("restaurant")) {
      resolvedType = "Restaurant pickup";
    } else if (lists.has("grocery")) {
      resolvedType = "Grocery pickup";
    }
  }

  return [
    "New order request",
    "",
    `Type: ${resolvedType}`,
    `Name: ${formData.get("customerName")}`,
    `Phone: ${formData.get("customerPhone")}`,
    `Pickup date: ${pickupDate}`,
    `Pickup time: ${pickupTime}`,
    "",
    "Items:",
    itemLines.length ? itemLines.join("\n") : "- See notes",
    "",
    "Notes:",
    notes || "None",
    "",
    "Payment will be handled separately."
  ].join("\n");
}

function prepareRequest(event) {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const notes = formData.get("notes")?.trim();

  if (orderItems.size === 0 && !notes) {
    requestOutput.hidden = false;
    requestText.textContent = "Please add at least one item or write the request in notes.";
    return;
  }

  const message = getOrderMessage(formData);
  const encodedSubject = encodeURIComponent(`${formData.get("orderType")} - ${formData.get("customerName")}`);
  const encodedBody = encodeURIComponent(message);

  requestText.textContent = message;
  requestOutput.hidden = false;
  emailLink.href = `mailto:${BUSINESS.email}?subject=${encodedSubject}&body=${encodedBody}`;
  whatsappLink.href = `https://wa.me/${BUSINESS.phoneDigits}?text=${encodedBody}`;
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
