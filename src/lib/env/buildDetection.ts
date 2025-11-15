/**
 * Build detection helper for Next.js
 * 
 * Use this to distinguish between the actual build phase (next build)
 * and runtime (production server handling requests).
 * 
 * CRITICAL: Do not rely on process.env.VERCEL alone, as it's set both
 * during build and runtime on Vercel deployments.
 */

/**
 * Returns true ONLY during the production build step (next build).
 * This is when we want to skip heavy external API calls (DB, OpenAI, Unsplash).
 * 
 * Returns false during runtime, even on Vercel production servers.
 */
export function isBuildPhase(): boolean {
  // NEXT_PHASE is set by Next.js during the build process
  // Reference: https://nextjs.org/docs/api-reference/next.config.js/environment-variables
  return process.env.NEXT_PHASE === 'phase-production-build';
}
