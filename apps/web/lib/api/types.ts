export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | any;
    requestId?: string;
  };
}

export interface BatchActionResult {
  successCount: number;
  failureCount: number;
  succeeded: string[];
  failed: Array<{
    id: string;
    reason: string;
    code: string;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
