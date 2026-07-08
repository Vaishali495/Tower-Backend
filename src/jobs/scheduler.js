const cron = require("node-cron");
const axios = require("axios");
const { NOTIFICATION_STATUS, REFERENCE_MODEL } = require("../constants/enums");
const Notification = require("../models/notification.model");
// Your Render backend URL
const BACKEND_URL = "https://vista-tower-backend.onrender.com/ping";

// Run every 14 minutes
cron.schedule("*/14 * * * *", async () => {
  try {
    const response = await axios.get(BACKEND_URL);

    console.log(
      `[${new Date().toISOString()}] Ping Success:`,
      response.status
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Ping Failed:`,
      error.message
    );
  }
});

// Delete read POST notifications older than 2 days — runs daily at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    // const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      referenceModel: REFERENCE_MODEL.POST,
      status: NOTIFICATION_STATUS.READ,
      createdAt: { $lt: twoDaysAgo },
    });

    console.log(
      `[${new Date().toISOString()}] Cleanup: deleted ${result.deletedCount} read POST notifications`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup Failed:`, error.message);
  }
});

console.log("Scheduler started...");