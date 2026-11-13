export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred.'
  });
}
