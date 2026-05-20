/**
 * Note: These tests are designed to be run with a testing framework like Vitest or Jest.
 */
import { calculateAge, isValidDate, isFutureDate } from './dateUtils';

describe('Date Utilities', () => {
  test('isValidDate should correctly validate dates', () => {
    expect(isValidDate(31, 1, 2020)).toBe(true);
    expect(isValidDate(29, 2, 2020)).toBe(true); // Leap year
    expect(isValidDate(29, 2, 2021)).toBe(false); // Non-leap year
    expect(isValidDate(31, 4, 2020)).toBe(false); // April only has 30 days
  });

  test('isFutureDate should detect if a date is in the future', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(isFutureDate(1, 1, nextYear)).toBe(true);
    expect(isFutureDate(1, 1, 1990)).toBe(false);
  });

  test('calculateAge should return correct age breakdown', () => {
    // Mock today's date if needed, but standard logic should work
    // Example: Person born 1990-01-01
    const age = calculateAge(1, 1, 1990);
    // This value will vary based on current year, but we can check if it's positive
    expect(age.years).toBeGreaterThanOrEqual(30);
    expect(age.months).toBeGreaterThanOrEqual(0);
    expect(age.days).toBeGreaterThanOrEqual(0);
  });
});
