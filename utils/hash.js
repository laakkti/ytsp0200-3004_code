const crypto = require("crypto");

/**
 * Calculates the SHA-256 hash of a given geometry object or string.
 * @param {Object|string} geometry - The geometry object or string.
 * @returns {string} The SHA-256 hash.
 */
const sha256 = (geometry) => {
  let jsonString = null;
  if (typeof geometry !== "string") {
    jsonString = JSON.stringify(geometry);
  } else {
    jsonString = geometry;
  }
  const hash = crypto.createHash("sha256").update(jsonString).digest("hex");
  return hash;
};

module.exports = {
  sha256,
};
