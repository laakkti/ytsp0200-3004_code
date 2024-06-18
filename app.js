const express = require("express");
const app = express();

// Middleware
const middleware = require('./utils/middleware');
const logger = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");

// Configuration
app.use(express.json({ limit: "10mb" }));
app.use('/', express.static('build'));
app.use(cors());
app.use(express.json());
dotenv.config();

// Token extraction middleware
app.use(middleware.tokenExtractor);

app.use(logger("dev"));

// Routes
const ndviRouter = require("./routes/ndvi-routes");
const userRouter = require("./routes/user-routes");

app.use("/ndvi/api/v1", ndviRouter);
app.use("/ndvi/api/v1", userRouter);

if (process.env.NODE_ENV !== 'production') {
  const devRouter = require('./routes/dev-routes');
  app.use('/ndvi/api/v1', devRouter);
}

// Error handling for invalid routes
app.use((req, res, next) => {
  res.status(404).send("Wrong address");
});

// Server setup
const http = require("http");
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
