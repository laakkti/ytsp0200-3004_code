const mongodb = require("../mongo/mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Authenticates a user based on the provided credentials.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} The response containing the authentication token and user information.
 */
const login = async (request, response, next) => {
  try {
    const body = request.body;

    const user = await mongodb.login(body.email);

    if (!user) {
      return response.status(401).json({
        error: "Invalid username or password",
      });
    }

    const passwordCorrect = await bcrypt.compare(body.password, user.passwordHash);

    if (!passwordCorrect) {
      return response.status(401).json({
        error: "Invalid username or password",
      });
    }

    const userForToken = {
      user: user.email,
      id: user._id,
      admin: user.admin,
    };

    const token = jwt.sign(userForToken, process.env.TOKEN);

    return response.status(200).json({
      token: token,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      admin: user.admin,
    });
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * Registers a new user with the provided information.
 * @param {Object} request - The HTTP request object.
 * @param {Object} response - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @returns {Object} The response indicating successful registration or an error message.
 */
const register = async (request, response, next) => {
  try {
    
    const { firstname, lastname, email, password, admin } = request.body;
    const user = await mongodb.login(email);

    if (user) {
      return response.status(401).json({
        error: "That email address is already in use",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await mongodb.register(firstname, lastname, email, passwordHash, admin);

    return response.status(200).json({
      message: "Registered successfully, please login.",
    });
  } catch (error) {
    console.error("ERROR: " + error.message);
    return response.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  login,
  register,
};
