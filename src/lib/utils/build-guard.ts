/**
 * Build-time and Runtime AI Guard Utilities
 * ==========================================
 * CRITICAL: These guards prevent AI generation during:
 * - Next.js SSG/export phase (build time)
 * - SSR page renders (runtime)
 * - ISR revalidation
 * 
 * AI generation is ONLY allowed via:
 * - Admin API routes (/api/admin/*)
 * - CLI scripts with ALLOW_AI_GENERATION=true
 */

// Global flag to enable AI generation (only set by admin routes)
let _aiGenerationAllowed = false;

/**
 * Enable AI generation for the current request context.
 * ONLY call this from admin API routes!
 */
export function enableAIGeneration(): void {
  _aiGenerationAllowed = true;
}

/**
 * Disable AI generation (reset after request)
 */
export function disableAIGeneration(): void {
  _aiGenerationAllowed = false;
}

/**
 * Check if AI generation is currently allowed
 */
export function isAIGenerationAllowed(): boolean {
  // Explicitly allowed via admin route
  if (_aiGenerationAllowed) return true;
  
  // CLI script override
  if (process.env.ALLOW_AI_GENERATION === 'true') return true;
  
  return false;
}

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
 * Check if AI generation should be blocked.
 * Returns true if:
 * - Build time (SSG/export)
 * - Runtime SSR/ISR without explicit admin permission
 */
export function shouldBlockAIGeneration(): boolean {
  // Always block during build
  if (isBuildTime()) return true;
  
  // At runtime, only allow if explicitly enabled
  return !isAIGenerationAllowed();
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
 * Log AI blocked message (for SSR/ISR)
 */
export function logAIBlocked(component: string, reason: string): void {
  console.log(`[${component}] AI blocked: ${reason}`);
}

/**
 * Assert we're not in build time (throws if we are)
 */
export function assertNotBuildTime(operation: string): void {
  if (isBuildTime()) {
    throw new Error(`${operation} cannot run during build time`);
  }
}

/**
 * Assert AI generation is allowed (throws if blocked)
 * Use this in AI generation functions to enforce the guard
 */
export function assertAIAllowed(operation: string): void {
  if (isBuildTime()) {
    throw new Error(`${operation} cannot run during build time`);
  }
  if (!isAIGenerationAllowed()) {
    throw new Error(
      `${operation} is not allowed during SSR/ISR. ` +
      `AI generation must be triggered via admin API or batch job.`
    );
  }
}
