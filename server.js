const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { SERVER_PORT } = require("./src/config");

const PORT = SERVER_PORT || 3000;
const server = http.createServer(app);

// =============================================================================
// DATABASE CONNECTION & SERVER STARTUP
// =============================================================================

// Connect to MongoDB, then start the HTTP server only on successful connection
// This ensures the server never starts with a broken database connection
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database, server not started:", err);
    process.exit(1);
  }
};

startServer();