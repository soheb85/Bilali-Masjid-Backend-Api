/* eslint-disable @typescript-eslint/no-explicit-any */
export function convertTo24Hour(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;

  const trimmed = timeStr.trim().toUpperCase();
  
  // Regex to catch things like "05:15 PM", "5:15pm", "12:00 AM"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);

  // If there is no AM or PM, we assume it's already in 24-hour format (e.g., "17:15")
  if (!match) {
    return timeStr;
  }

  const [ , hoursStr, minutes, period ] = match;
  let hours = parseInt(hoursStr, 10);

  if (period === 'PM' && hours !== 12) {
    hours += 12; // 1 PM becomes 13
  } else if (period === 'AM' && hours === 12) {
    hours = 0;   // 12 AM becomes 00
  }

  // Pad the hours with a leading zero so 9:00 becomes 09:00
  const paddedHours = hours.toString().padStart(2, '0');
  return `${paddedHours}:${minutes}`;
}

// A recursive function that goes through your entire JSON body 
// and converts every single string it finds!
export function formatAllTimesInObject(obj: any) {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = convertTo24Hour(obj[key]);
    } else if (typeof obj[key] === 'object') {
      // If it finds a nested object (like prayers.fajr), it dives inside and formats those too!
      formatAllTimesInObject(obj[key]);
    }
  }
}

export function convertTo12Hour(time24: string): string {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24;

  // ✅ Fix: Use const for minutes since it's never reassigned
  const [rawHours, minutes] = time24.split(':').map(Number);
  let hours = rawHours;

  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // Handle the '0' hour case for 12 AM
  
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  
  return `${paddedHours}:${paddedMinutes} ${period}`;
}
// Deep clones the object and converts all strings to 12h
export function formatAllTo12Hour(obj: any): any {
  const newObj = JSON.parse(JSON.stringify(obj)); // Deep clone
  
  const recurse = (current: any) => {
    for (const key in current) {
      if (typeof current[key] === 'string' && current[key].includes(':')) {
        current[key] = convertTo12Hour(current[key]);
      } else if (typeof current[key] === 'object' && current[key] !== null) {
        recurse(current[key]);
      }
    }
  };

  recurse(newObj);
  return newObj;
}