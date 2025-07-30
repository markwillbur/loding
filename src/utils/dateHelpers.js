// Utility function to convert Firestore timestamp to Date object
export const convertFirestoreTimestampToDate = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
};

// Helper to get the next Sunday at 11:00 AM
export const getNextSunday11AM = () => {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7); // Get next Sunday
  nextSunday.setHours(11, 0, 0, 0); // Set to 11:00 AM
  if (nextSunday < now) { // If it's already past 11 AM Sunday, get Sunday next week
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  return nextSunday;
};

// Helper to get the upcoming Monday at 12:00 AM (for reset logic)
export const getUpcomingMonday12AM = () => {
  const now = new Date();
  const upcomingMonday = new Date(now);
  upcomingMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7); // Get next Monday
  upcomingMonday.setHours(0, 0, 0, 0); // Set to 12:00 AM
  return upcomingMonday;
};

// Helper to compare if two dates are the same up to the minute
export const areDatesSameDayHourMinute = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate() &&
         date1.getHours() === date2.getHours() &&
         date1.getMinutes() === date2.getMinutes();
};

// NEW HELPER: Check if two dates are on the same calendar day (ignoring time)
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};


// MODIFIED HELPER: Get deadline for a meal type based on a specific baseDate
export const getMealDeadline = (mealType, baseDate) => {
  if (!baseDate) return null; // Ensure a base date is provided

  const deadlineDate = new Date(baseDate); // Start with the provided base date

  switch (mealType) {
    case 'breakfast':
      deadlineDate.setHours(11, 0, 0, 0); // 11:00 AM
      break;
    case 'lunch':
      deadlineDate.setHours(14, 0, 0, 0); // 2:00 PM
      break;
    case 'dinner':
      deadlineDate.setHours(17, 0, 0, 0); // 5:00 PM
      break;
    default:
      return null;
  }

  // If the calculated deadline is in the past relative to NOW, it means the user
  // selected a date in the past. We don't automatically push it to the next day
  // if the *baseDate* itself is in the past.
  // We only check if the specific mealtime for that baseDate has passed.
  const now = new Date();
  if (isSameDay(deadlineDate, now) && deadlineDate <= now) {
    // If it's today and the time has passed, this specific deadline is in the past.
    // We can either return it as a past deadline or indicate an error.
    // For now, we'll return it as is, and the app's filtering will handle it.
    // If you want to force future dates, you'd add more complex logic here.
  }

  return deadlineDate;
};
