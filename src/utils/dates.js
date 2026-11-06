

// Build date-input values from local calendar fields to avoid UTC date shifts.
export const localInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Returns a YYYY-MM-DD string for a date a given number of days in the past.
export const relativeDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localInputDate(date);
};
