const jwt = require("jsonwebtoken");

/**
 * Checks the expiration time of a given JWT token.
 *
 * @param {string} authToken - The JWT token to check.
 * @returns {number|null} - Returns the remaining time in seconds before the token expires,
 *                          or null if the token is undefined or doesn't contain an expiration time,
 *                          or 0 if an error occurs during the process.
 */

const checkToken = async (authToken) => {
  try {
    if (authToken !== undefined) {
      const decoded = jwt.decode(authToken);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded && decoded.exp) {
        return decoded.exp - currentTime;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (e) {
    return 0;
  }
};

module.exports = {
  checkToken,
};
