import type { RouteSegment, StaticSegment, DynamicSegment, CatchAllSegment, OptionalSegment } from './types';
import { createError, ErrorCodes } from '../errors';

const DYNAMIC_SEGMENT_REGEX = /^\[([^\]]+)\]$/;
const CATCH_ALL_SEGMENT_REGEX = /^\[\[([^\]]+)\]\]$/;
const OPTIONAL_SEGMENT_REGEX = /^\[\[?([^\]]+)\]?\]$/;

export function parseRoute(path: string): RouteSegment[] {
  const segments = path.split('/').filter(Boolean);
  return segments.map(parseSegment);
}

function parseSegment(segment: string): RouteSegment {
  // Check for dynamic segment [param]
  const dynamicMatch = segment.match(DYNAMIC_SEGMENT_REGEX);
  if (dynamicMatch) {
    return createDynamicSegment(dynamicMatch[1]);
  }

  // Check for catch-all segment [[...param]]
  const catchAllMatch = segment.match(CATCH_ALL_SEGMENT_REGEX);
  if (catchAllMatch) {
    return createCatchAllSegment(catchAllMatch[1]);
  }

  // Check for optional segment [[param]]
  const optionalMatch = segment.match(OPTIONAL_SEGMENT_REGEX);
  if (optionalMatch) {
    return createOptionalSegment(optionalMatch[1]);
  }

  // Static segment
  return createStaticSegment(segment);
}

function createStaticSegment(value: string): StaticSegment {
  return {
    type: 'static',
    value
  };
}

function createDynamicSegment(name: string): DynamicSegment {
  validateSegmentName(name);
  return {
    type: 'dynamic',
    name,
    pattern: undefined // Can be extended with custom patterns
  };
}

function createCatchAllSegment(name: string): CatchAllSegment {
  validateSegmentName(name);
  return {
    type: 'catchAll',
    name
  };
}

function createOptionalSegment(name: string): OptionalSegment {
  validateSegmentName(name);
  return {
    type: 'optional',
    name,
    pattern: undefined
  };
}

function validateSegmentName(name: string): void {
  if (!name || /[^a-zA-Z0-9_]/.test(name)) {
    throw createError({
      code: ErrorCodes.INVALID_CONFIG,
      message: `Invalid route parameter name: ${name}`,
      details: 'Route parameters must contain only alphanumeric characters and underscores',
      solution: 'Use only letters, numbers, and underscores in route parameter names'
    });
  }
} 