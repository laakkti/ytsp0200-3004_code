const sentinelHub = require("@sentinel-hub/sentinelhub-js");
const auth = require("../utils/authenticate");
const _checkToken = require("../utils/checkToken");

let authToken;

/**
 * Authenticates with the Sentinel Hub and retrieves an authentication token.
 *
 * @returns {Promise<string>} - A promise that resolves to the authentication token.
 */
const authenticate = async () => {
  const authToken = await auth.authenticate();
  return authToken;
};

authenticate();

/**
 * Checks the token expiration time and re-authenticates if the token is about to expire.
 *
 * @param {object} request - The HTTP request object.
 * @returns {Promise<void>} - A promise that resolves when the token check and possible re-authentication are complete.
 */
const doCheckToken = async (request) => {
  let expTime = await _checkToken.checkToken(authToken);
  console.log("expiration time: ", expTime);
  if (expTime <= 600) {
    authToken = await authenticate();
  }
};

/**
 * Middleware that checks the token and attaches it to the request object.
 *
 * @param {object} request - The HTTP request object.
 * @param {object} response - The HTTP response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the middleware function completes.
 */
const checkToken = async (request, response, next) => {
  await doCheckToken(request);

  request.checkToken = doCheckToken;
  request.authToken = authToken;
  next();
};

module.exports = {
  checkToken,
};
