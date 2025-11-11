const { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert IST date string to UTC Date object
 * Used when admin creates tasks with IST due dates
 * @param {string} istDateString - Date string in IST
 * @returns {Date} UTC Date object
 */
function istToUtc(istDateString) {
  return zonedTimeToUtc(istDateString, IST_TIMEZONE);
}

/**
 * Convert UTC Date to IST formatted string for display
 * Used throughout UI to show dates in IST
 * @param {Date} utcDate - UTC Date object
 * @param {string} format - date-fns format string
 * @returns {string} Formatted date string in IST
 */
function utcToIstDisplay(utcDate, format = 'dd MMM yyyy, hh:mm a') {
  return formatInTimeZone(utcDate, IST_TIMEZONE, format);
}

/**
 * Get current time in IST timezone
 * @returns {Date} Current time as Date object in IST
 */
function nowInIst() {
  return utcToZonedTime(new Date(), IST_TIMEZONE);
}

module.exports = {
  istToUtc,
  utcToIstDisplay,
  nowInIst,
  IST_TIMEZONE,
};
