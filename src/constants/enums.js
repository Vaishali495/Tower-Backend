// enums.js

const DEPARTMENTS = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  FURNITURE: "Furniture",
  GENERAL: "General",
};

const STATUS = {
  ASSIGNED: "Assigned",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REOPENED: "Reopened",
  CLOSED: "Closed",
};

const SEVERITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const ROLE = {
  ADMIN: "Admin",
  TENANT: "Tenant",
  TECHNICIAN: "Technician",
};

const UPLOAD_TYPES = {
  PROFILE: "profile",
  POST: "post",
  COMPLAINT: "complaint",
};

const NOTIFICATION_TYPE = {
  COMPLAINT_CREATED: "Complaint Created",
  COMPLAINT_UPDATED_BY_ADMIN: "Complaint Updated By Admin",
  COMPLAINT_UPDATED_BY_USER: "Complaint Updated By User",
  TECH_ASSIGNED: "Technician Assigned",
  TECH_STATUS_UPDATED: "Technician Status Updated",
  POST_CREATED: "Post Created",
  POST_UPDATED: "Post Updated",
};

const NOTIFICATION_STATUS = {
  UNREAD: "Unread",
  READ: "Read",
};

const REFERENCE_MODEL = {
  POST: "Post",
  COMPLAINT: "Complaint",
};

const TECHNICIAN_DESIGNATION = {
  ELECTRICIAN: "Electrician",
  PLUMBER: "Plumber",
  CARPENTER: "Carpenter",
  AC_TECHNICIAN: "Ac Technician",
  PAINTER: "Painter",
  CLEANER: "Cleaner",
};

module.exports = {
  DEPARTMENTS,
  STATUS,
  SEVERITY,
  ROLE,
  UPLOAD_TYPES,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  REFERENCE_MODEL,
  TECHNICIAN_DESIGNATION,
};
