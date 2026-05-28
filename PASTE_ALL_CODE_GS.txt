const SHEET_NAME = "Orders";
const ADMIN_KEY = "CHANGE_THIS_ADMIN_KEY";

const HEADERS = [
  "id",
  "createdAt",
  "updatedAt",
  "status",
  "orderType",
  "customerName",
  "customerPhone",
  "pickupDate",
  "pickupTime",
  "itemsJson",
  "notes",
  "cancelReason",
  "historyJson"
];

function doGet(event) {
  const params = event.parameter || {};
  const callback = params.callback || "callback";

  try {
    if (!/^[a-zA-Z0-9_.$]+$/.test(callback)) {
      throw new Error("Invalid callback.");
    }

    const action = params.action || "list";
    let result;

    if (action === "create") {
      result = createOrder_(params);
    } else if (action === "list") {
      requireAdmin_(params.adminKey);
      result = listOrders_();
    } else if (action === "status") {
      requireAdmin_(params.adminKey);
      result = updateStatus_(params);
    } else {
      throw new Error("Unknown action.");
    }

    return jsonp_(callback, { ok: true, ...result });
  } catch (error) {
    return jsonp_(callback, { ok: false, error: error.message });
  }
}

function createOrder_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrdersSheet_();
    const payload = JSON.parse(params.payload || "{}");
    const now = new Date().toISOString();
    const id = payload.id || "IB-" + Utilities.getUuid().slice(0, 8).toUpperCase();

    const order = {
      id,
      createdAt: payload.createdAt || now,
      updatedAt: now,
      status: "New",
      orderType: payload.orderType || "Pickup",
      customerName: payload.customerName || "",
      customerPhone: payload.customerPhone || "",
      pickupDate: payload.pickupDate || "",
      pickupTime: payload.pickupTime || "",
      items: Array.isArray(payload.items) ? payload.items : [],
      notes: payload.notes || "",
      cancelReason: "",
      history: [{ at: now, status: "New", note: "Created from website" }]
    };

    sheet.appendRow(orderToRow_(order));

    return { order };
  } finally {
    lock.releaseLock();
  }
}

function listOrders_() {
  const sheet = getOrdersSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return { orders: [] };
  }

  const orders = values.slice(1).map(rowToOrder_).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { orders };
}

function updateStatus_(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const id = params.id;
    const nextStatus = params.status;
    const cancelReason = params.cancelReason || "";
    const allowedStatuses = ["New", "Accepted", "Ready", "Completed", "Cancelled"];

    if (!id) throw new Error("Missing order ID.");
    if (!allowedStatuses.includes(nextStatus)) throw new Error("Invalid status.");

    const sheet = getOrdersSheet_();
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row, index) => index > 0 && row[0] === id);

    if (rowIndex === -1) {
      throw new Error("Order not found.");
    }

    const order = rowToOrder_(values[rowIndex]);
    const now = new Date().toISOString();

    order.status = nextStatus;
    order.updatedAt = now;
    order.cancelReason = nextStatus === "Cancelled" ? cancelReason : "";
    order.history = Array.isArray(order.history) ? order.history : [];
    order.history.push({
      at: now,
      status: nextStatus,
      note: nextStatus === "Cancelled" ? cancelReason : ""
    });

    sheet.getRange(rowIndex + 1, 1, 1, HEADERS.length).setValues([orderToRow_(order)]);

    return { order };
  } finally {
    lock.releaseLock();
  }
}

function requireAdmin_(adminKey) {
  if (!adminKey || adminKey !== ADMIN_KEY) {
    throw new Error("Invalid admin key.");
  }
}

function getOrdersSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function orderToRow_(order) {
  return [
    order.id,
    order.createdAt,
    order.updatedAt,
    order.status,
    order.orderType,
    order.customerName,
    order.customerPhone,
    order.pickupDate,
    order.pickupTime,
    JSON.stringify(order.items || []),
    order.notes,
    order.cancelReason || "",
    JSON.stringify(order.history || [])
  ];
}

function rowToOrder_(row) {
  return {
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    status: row[3],
    orderType: row[4],
    customerName: row[5],
    customerPhone: row[6],
    pickupDate: row[7],
    pickupTime: row[8],
    items: parseJson_(row[9], []),
    notes: row[10],
    cancelReason: row[11],
    history: parseJson_(row[12], [])
  };
}

function parseJson_(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch (error) {
    return fallback;
  }
}

function jsonp_(callback, payload) {
  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
