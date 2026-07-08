exports.successResponse = async (
  res,
  message,
  type,
  data,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    type,
    status: statusCode,
    message,
    ...(data && { data }), // Only include data if it exists
  });
};

exports.errorResponse = async (
  res,
  errorMessage,
  type,
  data,
  statusCode = 400,
) => {
  return res.status(statusCode).json({
    success: false,
    type,
    status: statusCode,
    message: errorMessage,
    ...(data && { data }), // Only include data if it exists
  });
};

exports.badResponse = async (res, errorMessage, type, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    type,
    status: statusCode,
    message: errorMessage,
  });
};
