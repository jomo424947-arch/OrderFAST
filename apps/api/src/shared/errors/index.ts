export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'KIOSK_CLOSED'
  | 'ITEM_UNAVAILABLE'
  | 'PRICE_MISMATCH'
  | 'ACCOUNT_RESTRICTED'
  | 'INVALID_STATE_TRANSITION'
  | 'ORDER_EXPIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code: ErrorCode = 'BAD_REQUEST', details?: unknown) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'يجب تسجيل الدخول أولاً') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'ليس لديك صلاحية لتنفيذ هذا الإجراء') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'العنصر المطلوب غير موجود') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, code: ErrorCode = 'CONFLICT', details?: unknown) {
    return new AppError(409, code, message, details);
  }

  static unprocessable(message: string, code: ErrorCode = 'VALIDATION_ERROR', details?: unknown) {
    return new AppError(422, code, message, details);
  }

  static internal(message = 'حدث خطأ داخلي غير متوقع في الخادم') {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}
