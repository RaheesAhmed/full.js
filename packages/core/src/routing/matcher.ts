import type { RouteNode, RouteMatch, RouteParams } from './types';
import { createError, ErrorCodes } from '../errors';

export function matchRoute(
  pathname: string,
  routeTree: RouteNode
): RouteMatch | null {
  const segments = pathname.split('/').filter(Boolean);
  const matches: RouteMatch[] = [];
  
  matchSegments(segments, routeTree, {}, 0, matches);
  
  if (matches.length === 0) {
    return null;
  }

  // Return the match with highest score
  return matches.sort((a, b) => b.score - a.score)[0];
}

function matchSegments(
  segments: string[],
  node: RouteNode,
  params: RouteParams,
  score: number,
  matches: RouteMatch[]
): void {
  // End of path reached
  if (segments.length === 0) {
    if (node.config) {
      matches.push({
        route: node.config,
        params,
        score
      });
    }
    return;
  }

  const segment = segments[0];
  const remainingSegments = segments.slice(1);

  // Try static matches first (highest priority)
  for (const [key, child] of node.children.entries()) {
    if (child.segment.type === 'static' && child.segment.value === segment) {
      matchSegments(
        remainingSegments,
        child,
        params,
        score + 100, // Static matches get highest score
        matches
      );
    }
  }

  // Try dynamic matches
  for (const [key, child] of node.children.entries()) {
    if (child.segment.type === 'dynamic') {
      const newParams = { ...params, [child.segment.name]: segment };
      matchSegments(
        remainingSegments,
        child,
        newParams,
        score + 50, // Dynamic matches get medium score
        matches
      );
    }
  }

  // Try catch-all matches (lowest priority)
  for (const [key, child] of node.children.entries()) {
    if (child.segment.type === 'catchAll') {
      const catchAllValue = segments.join('/');
      const newParams = { ...params, [child.segment.name]: catchAllValue };
      matchSegments(
        [], // Consume all remaining segments
        child,
        newParams,
        score + 10, // Catch-all matches get lowest score
        matches
      );
    }
  }
}

export function validateMatch(match: RouteMatch): void {
  if (!match.route.page) {
    throw createError({
      code: ErrorCodes.INVALID_CONFIG,
      message: 'Route matched but no page component found',
      details: `Route: ${match.route.path}`,
      solution: 'Ensure the route has a page component configured'
    });
  }
} 