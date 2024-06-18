var sentinelHub = require("@sentinel-hub/sentinelhub-js");

/**
 * Function to authenticate with Sentinel Hub API.
 * 
 * @returns {string} The authentication token.
 */
const authenticate = async () => {
  const clientId = process.env.sentinelHubClientId;
  const clientSecret = process.env.sentinelHubClientSecret;

  authToken = await sentinelHub.requestAuthToken(
    clientId,
    clientSecret
  );

  sentinelHub.setAuthToken(authToken);  
  return authToken;
};

module.exports = {
  authenticate
};
