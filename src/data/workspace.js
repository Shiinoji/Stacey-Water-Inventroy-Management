import { relativeDate } from "../utils/dates.js";

// These in-memory records seed the demo workspace when the app first loads.
export const initialEmployees = [
  { id: 1, first: "Marco", last: "Reyes", phone: "0917 555 0182", team: "Delivery team" },
  { id: 2, first: "Ana", last: "Santos", phone: "0918 240 7721", team: "Delivery team" },
  { id: 3, first: "Rafael", last: "Cruz", phone: "0920 318 6640", team: "Delivery team" },
];

export const initialContainers = [
  { id: 1, type: "5-gallon jug", ownership: "Company-owned", status: "Active", price: 35 },
  { id: 2, type: "Water dispenser", ownership: "Company-owned", status: "Active", price: 250 },
  { id: 3, type: "5-gallon jug", ownership: "Customer-owned", status: "Active", price: 30 },
];

export const initialAreas = [
  { id: 1, name: "Riverside", barangay: "San Isidro", employee: "Marco Reyes" },
  { id: 2, name: "North Park", barangay: "Poblacion", employee: "Ana Santos" },
  { id: 3, name: "Lakeside", barangay: "San Roque", employee: "Rafael Cruz" },
];

export const initialTransactions = [
  { id: "TR-1048", date: relativeDate(0), employee: "Marco Reyes", container: "5-gallon jug", area: "Riverside", issued: 18, returned: 12, damaged: 1, lost: 0, unitPrice: 35 },
  { id: "TR-1047", date: relativeDate(0), employee: "Ana Santos", container: "5-gallon jug", area: "North Park", issued: 24, returned: 19, damaged: 0, lost: 1, unitPrice: 35 },
  { id: "TR-1046", date: relativeDate(1), employee: "Rafael Cruz", container: "Water dispenser", area: "Lakeside", issued: 4, returned: 3, damaged: 0, lost: 0, unitPrice: 250 },
  { id: "TR-1045", date: relativeDate(1), employee: "Marco Reyes", container: "5-gallon jug", area: "Riverside", issued: 16, returned: 14, damaged: 0, lost: 0, unitPrice: 35 },
  { id: "TR-1044", date: relativeDate(2), employee: "Ana Santos", container: "5-gallon jug", area: "North Park", issued: 20, returned: 17, damaged: 1, lost: 0, unitPrice: 35 },
  { id: "TR-1043", date: relativeDate(2), employee: "Rafael Cruz", container: "Water dispenser", area: "Lakeside", issued: 6, returned: 5, damaged: 0, lost: 0, unitPrice: 250 },
];

export const defaultSettings = {
  businessName: "Stacey Water",
  email: "",
  phone: "",
  address: "",
  currency: "PHP",
  dateFormat: "MMM d, yyyy",
  defaultOwnership: "Company-owned",
};

export const settingOptions = {
  currency: ["PHP", "USD"],
  dateFormat: ["MMM d, yyyy", "dd/MM/yyyy", "yyyy-MM-dd"],
  defaultOwnership: ["Company-owned", "Customer-owned"],
};

// Ensures a selected JSON file has the shape expected by the backup importer.
export function isWorkspaceBackup(value) {
  const isObject = (item) => item !== null && typeof item === "object" && !Array.isArray(item);
  const isText = (item) => typeof item === "string";
  const isNumber = (item) => typeof item === "number" && Number.isFinite(item);
  const hasValidSettings = (item) => isObject(item) &&
    Object.keys(defaultSettings).every((key) => (
      typeof item[key] === "string" &&
      (settingOptions[key] ? settingOptions[key].includes(item[key]) : true)
    )) &&
    item.businessName.trim().length > 0;
  const hasValidEmployees = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.first) && isText(item.last) && isText(item.phone) &&
    (!("team" in item) || ["Delivery team", "Refilling team"].includes(item.team))
  );
  const hasValidContainers = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.type) &&
    ["Company-owned", "Customer-owned"].includes(item.ownership) &&
    ["Active", "Inactive"].includes(item.status) && isNumber(item.price) && item.price >= 0
  );
  const hasValidAreas = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isNumber(item.id) && isText(item.name) &&
    isText(item.barangay) && isText(item.employee)
  );
  const hasValidTransactions = (items) => Array.isArray(items) && items.every((item) =>
    isObject(item) && isText(item.id) && isText(item.date) &&
    !Number.isNaN(new Date(`${item.date}T00:00:00`).getTime()) &&
    (!("time" in item) || (isText(item.time) && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))) &&
    isText(item.employee) && isText(item.container) && isText(item.area) &&
    Number.isInteger(item.issued) && item.issued >= 1 &&
    Number.isInteger(item.returned) && item.returned >= 0 &&
    Number.isInteger(item.damaged) && item.damaged >= 0 &&
    Number.isInteger(item.lost) && item.lost >= 0 &&
    item.returned + item.damaged + item.lost <= item.issued &&
    isNumber(item.unitPrice) && item.unitPrice >= 0
  );

  return isObject(value) &&
    value.version === 1 &&
    hasValidSettings(value.businessSettings) &&
    hasValidEmployees(value.employees) &&
    hasValidContainers(value.containers) &&
    hasValidAreas(value.deliveryAreas) &&
    hasValidTransactions(value.transactionHistory) &&
    hasValidTransactions(value.pendingDeliveries);
}

// Reads saved business settings and validates them against the supported options.
export function loadSettings() {
  try {
    const saved = window.localStorage.getItem("stacey-water-settings");
    if (!saved) return defaultSettings;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaultSettings;
    return Object.fromEntries(Object.keys(defaultSettings).map((key) => {
      const value = parsed[key];
      const valid = settingOptions[key]
        ? settingOptions[key].includes(value)
        : typeof value === "string";
      return [key, valid ? value : defaultSettings[key]];
    }));
  } catch (error) {
    console.error("Unable to load saved business settings.", error);
    return defaultSettings;
  }
}

// Loads a saved list from local storage, falling back to the supplied seed data.
export function loadMasterData(key, initialData) {
  try {
    const saved = window.localStorage.getItem(`stacey-water-${key}`);
    if (!saved) return initialData;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error(`Saved ${key} data is not a list.`);
    }
    return parsed;
  } catch (error) {
    console.error(`Unable to load saved ${key} data.`, error);
    return initialData;
  }
}
