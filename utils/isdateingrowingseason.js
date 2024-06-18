/**
 * Checks if a given date falls within the specified growing season.
 * @param {Date|string} date - The date to check.
 * @param {object} growingSeason - Object representing the growing season with 'startMonth', 'startDay', 'endMonth', and 'endDay'.
 * @returns {boolean} True if the date is within the growing season, false otherwise.
 */
function isDateInGrowingSeason(date, growingSeason) {
  const month = new Date(date).getUTCMonth() + 1;
  const day = new Date(date).getUTCDate();

  if (month >= growingSeason.startMonth && month <= growingSeason.endMonth) {
    if ((month === growingSeason.startMonth && day < growingSeason.startDay) || (month === growingSeason.endMonth && day > growingSeason.endDay)) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

module.exports = isDateInGrowingSeason;
