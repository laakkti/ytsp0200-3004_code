const jwt = require("jsonwebtoken");

/**
 * Retrieves the token from the request headers.
 * @param {object} request - The HTTP request object.
 * @returns {string|null} The extracted token or null if not found.
 */
const getTokenFrom = (request) => {
  const authorization = request.get("authorization");

  if (authorization && authorization.startsWith("bearer ")) {
    return authorization.replace("bearer ", "");
  }
  return null;
};

/**
 * Middleware for extracting and verifying JWT token from requests.
 * @param {object} request - The HTTP request object.
 * @param {object} response - The HTTP response object.
 * @param {Function} next - The next middleware function in the stack.
 */
const tokenExtractor = (request, response, next) => {
  const url = request.originalUrl;

  // Allow access to routes like '/' or those involving user authentication
  if (url === "/" || url.includes("login") || url.includes("register")) {
    return next();
  }

  let token = getTokenFrom(request);

  if (!token) {
    console.log("!token");
    return response.status(401).json({ error: "token missing or invalid" });
  } else {
    request.token = token;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN);

    if (decodedToken.id) {
      request.user = decodedToken.user;
      request.admin = decodedToken.admin;
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return response.status(401).json({ error: "token missing or invalid" });
  }
};

module.exports = {
  tokenExtractor,
};
