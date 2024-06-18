/**
 * Formats the elapsed time into minutes and seconds.
 * @param {number} elapsedTime - The elapsed time in milliseconds.
 * @returns {string} A formatted string representing the elapsed time in minutes and seconds (MM:SS).
 */
const getFormattedTime = (elapsedTime) => {
  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Sets the time of a date object to midnight (00:00:00.000).
 * @param {Date} date - The date object.
 * @returns {string} An ISO string representing the date with time set to midnight.
 */
const zeroDateTime = (date) => {
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

/**
 * Adds one day to the given date.
 * @param {Date} date - The date object.
 * @returns {string} An ISO string representing the date after adding one day.
 */
const addOneDay = (date) => {
  date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
};

/**
 * Sorts an array of objects by a specified date-time property.
 * @param {Array} array - The array of objects to sort.
 * @param {string} property - The date-time property by which to sort.
 * @param {string} [sortOrder='asc'] - The sort order ('asc' for ascending, 'desc' for descending).
 * @returns {Array} The sorted array of objects.
 */
const sortByDateTime = (array, property, sortOrder = 'asc') => {
  return array.sort((a, b) => {
    a = new Date(a[property]);
    b = new Date(b[property]);

    if (sortOrder.toLowerCase() === 'desc') {
      return b - a;
    } else {
      return a - b;
    }
  });
};

module.exports = {
  getFormattedTime,
  zeroDateTime,
  addOneDay,
  sortByDateTime
};
