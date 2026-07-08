const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const router = require("./routes/index");
const { errorHandler } = require("./middleware/error.middleware");
const limiter = require("./middleware/limiter");
// const requestLogger = require("./middleware/requestLogger");

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("./jobs/scheduler");
const connectDB = require("./config/db");

/**
 * =============================================================================
 * EXPRESS APPLICATION SETUP
 * =============================================================================
 *
 * This file configures the core Express application and HTTP server with:
 * - Middleware setup (CORS, body parsing, rate limiting, static files)
 * - Route mounting under the /api prefix
 * - Swagger UI documentation at /api-docs
 * - MongoDB connection via Mongoose
 * - Server startup on the configured port
 *
 * Architecture:
 * - /api/* - All application routes (auth, users, etc.) via central router
 * - /api-docs - Swagger UI for interactive API documentation
 * - /uploads - Statically served uploaded files
 *
 * =============================================================================
 */

// Initialize Express application and wrap it in a native HTTP server
// (HTTP server allows future WebSocket or Socket.io support)
const app = express();
// const server = http.createServer(app);
// const PORT = SERVER_PORT || 3000;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Enable CORS for all routes
// Allows cross-origin requests from frontend clients
app.use(cors());

// Set EJS as the templating engine for server-rendered views
app.set("view engine", "ejs");

// Parse URL-encoded form data (e.g. HTML form submissions)
app.use(bodyParser.urlencoded({ extended: false }));

// Parse incoming JSON request bodies
// Enables req.body to contain parsed JSON data
app.use(bodyParser.json());
// app.use(requestLogger);

// Apply rate limiting to all requests
// Prevents abuse and protects against brute-force attacks
app.use("/api",limiter);

// Serve uploaded files as static assets under the /uploads URL path
// Maps to the local ./uploads directory on disk
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

// Root health check — confirms the API is live
app.get("/", (req, res) => {
  res.send("API is running");
});

// Ping endpoint — used to keep the server awake (e.g. by uptime monitors)
app.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is awake",
    timestamp: new Date(),
  });
});

// =============================================================================
// ROUTES SETUP
// =============================================================================

// Mount all API routes under the /api prefix
// The central router (./routes/index) distributes to individual route modules
app.use("/api", router);

// =============================================================================
// SWAGGER DOCUMENTATION
// =============================================================================

// Load the Swagger spec from the YAML definition file
// and serve it as an interactive UI at /api-docs
const swaggerDocument = YAML.load("./docs/swagger.yaml");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,   // Keeps the auth token across page reloads
    },
  }),
);

// =============================================================================
// ERROR HANDLING MIDDLEWARE (must be last)
// =============================================================================

// Global error handler — catches all errors passed via next(err)
// Must be registered after all routes and other middleware
app.use(errorHandler);


// const startServer = async () => {
//   await connectDB();

//   server.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
// };

// startServer();

module.exports = app;