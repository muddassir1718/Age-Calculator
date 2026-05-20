/**
 * Validates if the given day, month, and year form a valid date.
 */
export function isValidDate(day: number, month: number, year: number): boolean {
  // Basic range checks
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Checks if a date is in the future.
 */
export function isFutureDate(day: number, month: number, year: number): boolean {
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Only compare dates, not time
  return inputDate > today;
}

/**
 * Calculates the age in years, months, and days between two dates.
 * If no end date is provided, today's date is used as default.
 */
export function calculateAge(
  startDay: number,
  startMonth: number,
  startYear: number,
  endDay?: number,
  endMonth?: number,
  endYear?: number
) {
  const birthDate = new Date(startYear, startMonth - 1, startDay);
  
  let today: Date;
  if (endDay !== undefined && endMonth !== undefined && endYear !== undefined) {
    today = new Date(endYear, endMonth - 1, endDay);
  } else {
    today = new Date();
  }

  // Ensure they are compared as start < end. If not, swap or return zeroes
  if (birthDate > today) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    // Get the last day of the previous month relative to the "today" (end) date
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}
