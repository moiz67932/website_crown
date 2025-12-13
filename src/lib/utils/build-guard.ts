/**
 * Build-time detection utilities
 * Prevents AI generation during Next.js SSG/export phase
 */

/**
 * Detect if code is running during Next.js build phase
 * Returns true during:
 * - next build
 * - next export
 * - Vercel production builds
 */
export function isBuildTime(): boolean {
  // Next.js phase detection
  const phase = process.env.NEXT_PHASE;
  if (phase === 'phase-production-build' || phase === 'phase-export') {
    return true;
  }
  
  // Vercel build detection
  if (process.env.VERCEL_ENV && process.env.CI === 'true') {
    return true;
  }
  
  // Generic CI detection
  if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
    return true;
  }
  
  return false;
}

/**
 * Log build-time skip message
 */
export function logBuildSkip(component: string): void {
  if (isBuildTime()) {
    console.log(`[${component}] Build phase – AI skipped`);
  }
}

/**
 * Assert we're not in build time (throws if we are)
 */
export function assertNotBuildTime(operation: string): void {
  if (isBuildTime()) {
    throw new Error(`${operation} cannot run during build time`);
  }
}
