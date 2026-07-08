const router = require("express").Router();
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const postRoutes = require("./post.routes");
const complaintRoutes = require("./complaint.routes");
const notificationRoutes = require("./notification.routes");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/post", postRoutes);
router.use("/complaint", complaintRoutes);
router.use("/notification",notificationRoutes);

module.exports = router;
