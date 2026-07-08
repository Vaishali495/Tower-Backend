const { ROLE } = require("../constants/enums");

const isAdmin = (req, res, next) => {
  if (req.user?.role !== ROLE.ADMIN) {
    return res.status(403).json({
      error: "Access denied",
      message: "Admin only route",
    });
  }
  next();
};

const isTenant = (req, res, next) => {
  if (req.user?.role !== ROLE.TENANT) {
    return res.status(403).json({
      error: "Access denied",
      message: "Tenant only route",
    });
  }
  next();
};

const isTechnician = (req, res, next) => {
  if (req.user?.role !== ROLE.TECHNICIAN) {
    return res.status(403).json({
      error: "Access denied",
      message: "Technician only route",
    });
  }
  next();
};

module.exports = { isAdmin, isTenant, isTechnician };
