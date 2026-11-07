

export const formatMoney = (value, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export function formatDate(value, format = "MMM d, yyyy") {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (format === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(value) {
  if (!value) return "Not recorded";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return "Not recorded";
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}
