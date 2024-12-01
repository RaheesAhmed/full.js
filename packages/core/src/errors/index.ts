import type { FullError } from '../types';

export function createError(options: {
  code: string;
  message: string;
  details?: unknown;
  solution?: string;
}): FullError {
  const error = new Error(options.message) as FullError;
  error.code = options.code;
  error.details = options.details;
  error.solution = options.solution;
  return error;
}

export const ErrorCodes = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  DATA_FETCH_FAILED: 'DATA_FETCH_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  OPTIMIZATION_FAILED: 'OPTIMIZATION_FAILED'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function isFullError(error: unknown): error is FullError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as FullError).code === 'string'
  );
} 