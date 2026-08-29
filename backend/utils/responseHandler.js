// Success response
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Error response
export const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

// Paginated response
export const paginatedResponse = (
  res,
  data,
  page,
  limit,
  total,
  message = 'Success',
  statusCode = 200
) => {
  const pages = Math.ceil(total / limit);

  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    },
  });
};

export default { successResponse, errorResponse, paginatedResponse };
