/**
 * AI Landing Page Generation v4 Module
 * =====================================
 * Enhanced generation with:
 * - v4 prompts with GEO SAFETY
 * - Semantic validation (post-schema)
 * - Repair retry logic
 * - Input enrichment integration
 * 
 * This module extends the base landing.ts functionality.
 * Use generateLandingPageContentV4() for the new pipeline.
 * 
 * @version 4.0.0
 */

import OpenAI from 'openai';
import type { PageTypeConfig } from './pageTypes';
import type { LandingPageContent, InputJson } from './landing';
import { LandingPageContentSchema } from './landing';
import { BASE_PROMPT_V4, buildUserPromptV4, buildRepairPrompt } from './prompts/landing.v4';
import { 
  validateLandingOutput, 
  deriveAllowedPlaceNames,
  type ValidationResult,
  type ValidationError,
} from './validators/landingOutputValidator';
import { enrichWithAllowlist } from './input/buildLandingInputFromDb';
import { isBuildTime, shouldBlockAIGeneration, logBuildSkip, logAIBlocked } from '@/lib/utils/build-guard';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Maximum total attempts for generation (including repairs)
 * Can be overridden via LANDING_MAX_ATTEMPTS env var
 */
const MAX_ATTEMPTS = parseInt(process.env.LANDING_MAX_ATTEMPTS || '3', 10);

/**
 * Whether to use v4 prompts by default
 * Set LANDING_PROMPT_VERSION=v3 to use legacy prompts
 */
const USE_V4_PROMPTS = process.env.LANDING_PROMPT_VERSION !== 'v3';

// ============================================================================
// Types
// ============================================================================

export interface GenerationResultV4 {
  content: LandingPageContent;
  model_used: string;
  attempts: number;
  semantic_repairs: number;
  validation_errors_fixed: string[];
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AttemptResult {
  content: LandingPageContent;
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// OpenAI Client
// ============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Get model to use for generation
 */
function getModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

// ============================================================================
// Debug Logger
// ============================================================================

function debugLog(message: string, data?: Record<string, unknown>): void {
  if (process.env.LANDING_DEBUG === 'true') {
    console.log(`[AI v4 Debug] ${message}`, data ?? '');
  }
}

/**
 * Log semantic validation failure (structured, safe)
 */
function logSemanticFailure(
  city: string,
  pageType: string,
  attempt: number,
  errors: ValidationError[]
): void {
  console.warn('[Landing v4] Semantic validation failed', {
    city,
    pageType,
    attempt,
    errorCount: errors.length,
    errorCodes: errors.map(e => e.code),
    // Don't log full details to avoid sensitive content leaking
    sampleErrors: errors.slice(0, 3).map(e => ({
      code: e.code,
      message: e.message.slice(0, 100),
    })),
  });
}

// ============================================================================
// Core Generation Function (v4)
// ============================================================================

/**
 * Attempt generation with v4 prompts
 */
async function attemptGenerationV4(
  model: string,
  userPrompt: string,
  inputJson: InputJson
): Promise<AttemptResult> {
  const openai = getOpenAIClient();
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '8000', 10);

  debugLog('Attempting v4 generation', {
    model,
    promptLength: userPrompt.length,
    maxTokens,
  });

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: BASE_PROMPT_V4 },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 1,
    max_completion_tokens: maxTokens,
  });

  const choice = completion.choices?.[0];
  const msg = choice?.message;

  // Check for truncation
  if (choice?.finish_reason === 'length') {
    throw new Error(`Response truncated (max tokens reached with ${model})`);
  }

  // Extract content
  let responseContent: string | undefined;

  if (!msg) {
    throw new Error(`${model} returned empty response (no message)`);
  }

  if (typeof msg.content === 'string') {
    responseContent = msg.content.trim();
  } else if (Array.isArray(msg.content)) {
    responseContent = (msg.content as unknown[])
      .map((part: unknown) => {
        if (typeof part === 'string') return part;
        const typedPart = part as { type?: string; text?: string };
        if (typedPart?.type === 'text' && typeof typedPart.text === 'string') {
          return typedPart.text;
        }
        return '';
      })
      .join('')
      .trim();
  }

  if (!responseContent) {
    throw new Error(`${model} returned empty content`);
  }

  debugLog('Raw JSON response (first 500 chars)', {
    content: responseContent.slice(0, 500),
  });

  // Parse JSON
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseContent);
  } catch {
    throw new Error(`Failed to parse JSON response from ${model}`);
  }

  // Validate with Zod schema
  const parseResult = LandingPageContentSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    debugLog('Zod validation failed', {
      errors: parseResult.error.errors,
    });
    throw new Error(
      `Schema validation failed: ${parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ')}`
    );
  }

  const content = parseResult.data;

  // Post-validation fixes
  if (content.seo.title.length > 60) {
    content.seo.title = content.seo.title.substring(0, 57) + '...';
  }
  if (content.seo.meta_description.length > 155) {
    content.seo.meta_description = content.seo.meta_description.substring(0, 152) + '...';
  }
  if (content.seo.canonical_path !== inputJson.canonical_path) {
    content.seo.canonical_path = inputJson.canonical_path;
  }

  return {
    content,
    tokenUsage: completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Attempt repair generation with error context
 */
async function attemptRepairGeneration(
  model: string,
  originalUserPrompt: string,
  previousOutput: LandingPageContent,
  errors: ValidationError[],
  inputJson: InputJson
): Promise<AttemptResult> {
  const openai = getOpenAIClient();
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '8000', 10);

  // Build repair prompt
  const repairInstructions = buildRepairPrompt(errors);

  debugLog('Attempting repair generation', {
    model,
    errorCount: errors.length,
    errorCodes: errors.map(e => e.code),
  });

  // Combine original prompt with repair instructions and previous output
  const repairPrompt = `${originalUserPrompt}

PREVIOUS OUTPUT (has errors that must be fixed):
${JSON.stringify(previousOutput, null, 2)}

${repairInstructions}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: BASE_PROMPT_V4 },
      { role: 'user', content: repairPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 1, // Lower temperature for repair to be more deterministic
    max_completion_tokens: maxTokens,
  });

  const choice = completion.choices?.[0];
  const msg = choice?.message;

  if (!msg?.content) {
    throw new Error('Repair generation returned empty response');
  }

  const responseContent = typeof msg.content === 'string' 
    ? msg.content.trim() 
    : '';

  if (!responseContent) {
    throw new Error('Repair generation returned empty content');
  }

  // Parse and validate
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseContent);
  } catch {
    throw new Error('Failed to parse repair JSON response');
  }

  const parseResult = LandingPageContentSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    throw new Error(
      `Repair schema validation failed: ${parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ')}`
    );
  }

  const content = parseResult.data;

  // Ensure canonical_path is correct
  if (content.seo.canonical_path !== inputJson.canonical_path) {
    content.seo.canonical_path = inputJson.canonical_path;
  }

  return {
    content,
    tokenUsage: completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}

// ============================================================================
// Main v4 Generation Function
// ============================================================================

/**
 * Generate landing page content with v4 pipeline:
 * 1. Generate with v4 prompts (GEO SAFETY, enriched input)
 * 2. Validate schema (Zod)
 * 3. Validate semantic rules (post-schema)
 * 4. If semantic fails, attempt repair retry with error context
 * 5. Limit to MAX_ATTEMPTS total
 * 
 * @param pageTypeConfig - Page type configuration
 * @param inputJson - Input JSON (will be enriched with allowlist if not present)
 * @returns GenerationResultV4 with content and metadata
 */
export async function generateLandingPageContentV4(
  pageTypeConfig: PageTypeConfig,
  inputJson: InputJson
): Promise<GenerationResultV4> {
  // Guards
  if (isBuildTime()) {
    logBuildSkip('AI Landing Generation v4');
    throw new Error('AI generation is disabled during build time.');
  }

  if (shouldBlockAIGeneration()) {
    logAIBlocked('AI Landing Generation v4', 'SSR/ISR without admin permission');
    throw new Error(
      'AI generation is disabled during SSR/ISR. ' +
      'Content must be pre-generated via admin API or batch job.'
    );
  }

  // Validate required fields
  if (!inputJson.city) {
    throw new Error('inputJson.city is required');
  }
  if (!inputJson.canonical_path) {
    throw new Error('inputJson.canonical_path is required');
  }

  // Enrich input with allowlist if not present
  const enrichedInput = inputJson.allowed_place_names 
    ? inputJson 
    : enrichWithAllowlist(inputJson);

  const model = getModel();
  const userPrompt = buildUserPromptV4(pageTypeConfig, enrichedInput);

  console.log('[Landing v4] Starting generation', {
    city: inputJson.city,
    pageType: pageTypeConfig.PAGE_TYPE_SLUG,
    model,
    allowedPlacesCount: (enrichedInput.allowed_place_names as string[] | undefined)?.length || 0,
  });

  let attempts = 0;
  let semanticRepairs = 0;
  const errorsFixed: string[] = [];
  let lastContent: LandingPageContent | null = null;
  let lastErrors: ValidationError[] = [];
  let tokenUsage: GenerationResultV4['token_usage'];

  // ============================================================================
  // ATTEMPT LOOP
  // ============================================================================
  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    try {
      let result: AttemptResult;

      if (lastContent && lastErrors.length > 0) {
        // Repair attempt
        debugLog(`Attempt ${attempts}: Repair generation`, { errorCount: lastErrors.length });
        result = await attemptRepairGeneration(
          model,
          userPrompt,
          lastContent,
          lastErrors,
          enrichedInput
        );
        semanticRepairs++;
      } else {
        // Fresh attempt
        debugLog(`Attempt ${attempts}: Fresh generation`, { model });
        result = await attemptGenerationV4(model, userPrompt, enrichedInput);
      }

      lastContent = result.content;
      tokenUsage = result.tokenUsage;

      // Run semantic validation
      const validationResult = validateLandingOutput(result.content, enrichedInput);

      if (validationResult.ok) {
        // SUCCESS!
        console.log('[Landing v4] Generation successful', {
          city: inputJson.city,
          pageType: pageTypeConfig.PAGE_TYPE_SLUG,
          attempts,
          semanticRepairs,
          errorsFixed: errorsFixed.length,
        });

        return {
          content: result.content,
          model_used: model,
          attempts,
          semantic_repairs: semanticRepairs,
          validation_errors_fixed: errorsFixed,
          token_usage: tokenUsage,
        };
      }

      // Semantic validation failed
      lastErrors = validationResult.errors;
      errorsFixed.push(...validationResult.errors.map(e => e.code));

      logSemanticFailure(
        inputJson.city,
        pageTypeConfig.PAGE_TYPE_SLUG,
        attempts,
        validationResult.errors
      );

      // If we have attempts left, continue to repair
      if (attempts < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Landing v4] Attempt ${attempts} failed:`, errorMessage);

      // Reset for fresh attempt if schema failed
      lastContent = null;
      lastErrors = [];

      if (attempts >= MAX_ATTEMPTS) {
        throw new Error(`All ${MAX_ATTEMPTS} generation attempts failed. Last error: ${errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // All attempts exhausted with semantic failures
  console.error('[Landing v4] All attempts failed semantic validation', {
    city: inputJson.city,
    pageType: pageTypeConfig.PAGE_TYPE_SLUG,
    attempts,
    lastErrorCodes: lastErrors.map(e => e.code),
  });

  throw new Error(
    `Generation failed after ${attempts} attempts. ` +
    `Last semantic errors: ${lastErrors.map(e => e.code).join(', ')}`
  );
}

/**
 * Simplified wrapper that returns just the content
 * For backward compatibility with existing code
 */
export async function generateLandingContentV4Simple(
  pageTypeConfig: PageTypeConfig,
  inputJson: InputJson
): Promise<LandingPageContent> {
  const result = await generateLandingPageContentV4(pageTypeConfig, inputJson);
  return result.content;
}

/**
 * Validate existing content without regenerating
 * Useful for checking stored pages
 */
export function validateExistingContent(
  content: LandingPageContent,
  inputJson: InputJson
): ValidationResult {
  const enrichedInput = inputJson.allowed_place_names
    ? inputJson
    : enrichWithAllowlist(inputJson);
  
  return validateLandingOutput(content, enrichedInput);
}

// Re-export for convenience
export { deriveAllowedPlaceNames } from './validators/landingOutputValidator';
export { buildEnrichedInputJson, enrichWithAllowlist } from './input/buildLandingInputFromDb';
export { USE_V4_PROMPTS };
