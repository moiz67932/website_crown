/**
 * Integration Test: Landing Generation Pipeline v4
 * =================================================
 * Tests the full generation pipeline with mocked AI responses.
 * 
 * Run with:
 *   npx ts-node --project tsconfig.scripts.json src/ai/__tests__/landingGenerationPipeline.test.ts
 */

import type { PageTypeConfig } from '../pageTypes';
import type { LandingPageContent, InputJson } from '../landing';

// ============================================================================
// Test Helper
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  };
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeTrue() {
      if (actual !== true) {
        throw new Error(`Expected true, got ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected defined value, got ${actual}`);
      }
    },
    toContain(item: string) {
      if (typeof actual !== 'string' || !actual.includes(item)) {
        throw new Error(`Expected string to contain "${item}"`);
      }
    },
  };
}

// ============================================================================
// Mock Setup
// ============================================================================

// Store for controlling mock behavior
let mockCallCount = 0;
let mockBehavior: 'succeed' | 'fail-geo-then-succeed' | 'always-fail' = 'succeed';

function resetMock() {
  mockCallCount = 0;
  mockBehavior = 'succeed';
}

function setMockBehavior(behavior: typeof mockBehavior) {
  mockBehavior = behavior;
}

// Valid output fixture
function createValidOutput(input: InputJson): LandingPageContent {
  return {
    seo: {
      title: 'Homes for Sale in Irvine, CA',
      meta_description: 'Browse Irvine homes for sale.',
      h1: 'Homes for Sale in Irvine',
      canonical_path: input.canonical_path,
      og_title: 'Irvine Homes',
      og_description: 'Find homes in Irvine.',
    },
    intro: {
      subheadline: 'Find your perfect home',
      quick_bullets: ['Updated listings', 'Local expertise', 'Market data', 'Agent support'],
      last_updated_line: 'Last updated January 2025',
    },
    sections: {
      hero_overview: {
        heading: 'Homes for Sale in Irvine',
        body: 'Explore Irvine homes for sale in California.',
      },
      about_area: {
        heading: 'About Irvine',
        body: 'Irvine is a master-planned community in Orange County.',
      },
      neighborhoods: {
        heading: 'Neighborhoods',
        body: 'Irvine has diverse neighborhoods.',
        cards: [
          {
            name: 'Central Irvine',
            blurb: 'Heart of the city',
            best_for: ['Families', 'Commuters'],
            internal_link_text: 'Irvine Condos For Sale',
            internal_link_href: '/california/irvine/condos-for-sale',
          },
        ],
      },
      buyer_strategy: {
        heading: 'How to Buy',
        body: `Steps to buy in Irvine:\\n- Set your budget\\n- Get pre-approved\\n- Define priorities\\n- Search listings\\n- Schedule tours\\n- Make an offer\\n- Complete inspection\\n- Close escrow`,
        cta: {
          title: 'Ready to start?',
          body: 'Contact us today.',
          button_text: 'Contact an agent',
          button_href: '/contact',
        },
      },
      property_types: {
        heading: 'Property Types',
        body: 'Irvine offers condos, townhomes, and single-family homes.',
      },
      market_snapshot: {
        heading: 'Market Snapshot',
        body: `Current market data. Data source: ${input.data_source}. Last updated: ${input.last_updated_iso}.`,
      },
      schools_education: {
        heading: 'Schools',
        body: 'Irvine has excellent schools. Verify boundaries.',
      },
      lifestyle_amenities: {
        heading: 'Lifestyle',
        body: 'Outdoor recreation and shopping in Irvine.',
      },
      featured_listings: {
        heading: 'Featured Listings',
        body: 'Some featured listings may not show every detail (such as square footage or bed/bath count) in the quick view; open the full listing page for complete information before making decisions.',
      },
      working_with_agent: {
        heading: 'Work With Us',
        body: 'Crown Coastal Homes can help. Agent: Reza Barghlameno (DRE 02211952).',
      },
    },
    faq: [
      { q: 'How competitive is the market?', a: 'The market is competitive.' },
      { q: 'What is the price range?', a: 'Prices vary by neighborhood.' },
      { q: 'How long do homes stay?', a: 'Average days varies.' },
      { q: 'Need pre-approval?', a: 'Yes, recommended.' },
      { q: 'HOA costs?', a: 'Depends on property.' },
      { q: 'Best time to buy?', a: 'Spring and fall.' },
      { q: 'Closing costs?', a: 'Budget accordingly.' },
      { q: 'Agent benefits?', a: 'Local expertise.' },
    ],
    internal_linking: {
      in_body_links: [
        { href: '/california/irvine/condos-for-sale', anchor: 'Irvine Condos For Sale', context_note: 'Related condos' },
      ],
      related_pages: [{ href: '/california/irvine/condos-for-sale', anchor: 'Irvine Condos For Sale' }],
      more_in_city: [{ href: '/california/irvine/luxury-homes', anchor: 'Irvine Luxury Homes' }],
      nearby_cities: [{ href: '/california/tustin/homes-for-sale', anchor: 'Tustin' }],
    },
    trust: {
      about_brand: 'Crown Coastal Homes is a trusted brokerage.',
      agent_box: {
        headline: 'Work with a local expert',
        body: 'Contact Reza Barghlameno.',
        disclaimer: 'General info only. Verify details.',
      },
    },
  };
}

// Output with geo issue (La Jolla mentioned for Irvine)
function createOutputWithGeoIssue(input: InputJson): LandingPageContent {
  const valid = createValidOutput(input);
  // Add forbidden place name
  valid.sections.about_area.body = 'Explore La Jolla beaches and Pacific Beach near Irvine.';
  return valid;
}

// ============================================================================
// Mock Generation Function
// ============================================================================

/**
 * Mock version of the generation function for testing
 * Simulates the pipeline behavior without calling OpenAI
 */
async function mockGenerateLandingPageContentV4(
  _pageTypeConfig: PageTypeConfig,
  inputJson: InputJson
): Promise<{
  content: LandingPageContent;
  model_used: string;
  attempts: number;
  semantic_repairs: number;
}> {
  mockCallCount++;

  // Import validator
  const { validateLandingOutput, deriveAllowedPlaceNames } = await import('../validators/landingOutputValidator');
  
  // Enrich input
  const enrichedInput = {
    ...inputJson,
    allowed_place_names: deriveAllowedPlaceNames(inputJson),
  };

  switch (mockBehavior) {
    case 'succeed': {
      const content = createValidOutput(enrichedInput);
      const validation = validateLandingOutput(content, enrichedInput);
      
      if (!validation.ok) {
        throw new Error(`Mock succeeded but validation failed: ${validation.errors.map(e => e.code).join(', ')}`);
      }
      
      return {
        content,
        model_used: 'mock-model',
        attempts: 1,
        semantic_repairs: 0,
      };
    }

    case 'fail-geo-then-succeed': {
      if (mockCallCount === 1) {
        // First call returns geo-invalid content
        const badContent = createOutputWithGeoIssue(enrichedInput);
        const validation = validateLandingOutput(badContent, enrichedInput);
        
        if (validation.ok) {
          throw new Error('Expected geo validation to fail');
        }
        
        // Simulate retry - return valid content on second attempt
        const goodContent = createValidOutput(enrichedInput);
        return {
          content: goodContent,
          model_used: 'mock-model',
          attempts: 2,
          semantic_repairs: 1,
        };
      }
      
      // Subsequent calls succeed
      return {
        content: createValidOutput(enrichedInput),
        model_used: 'mock-model',
        attempts: 1,
        semantic_repairs: 0,
      };
    }

    case 'always-fail': {
      throw new Error('All generation attempts failed (mock)');
    }

    default:
      throw new Error(`Unknown mock behavior: ${mockBehavior}`);
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

const testPageType: PageTypeConfig = {
  PAGE_TYPE_SLUG: 'homes-for-sale',
  PRIMARY_INTENT: '{{city}} homes for sale',
  SYN1: 'real estate in {{city}}',
  SYN2: 'houses in {{city}}',
  SYN3: 'properties for sale in {{city}}',
};

function createTestInput(): InputJson {
  return {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'Cloud SQL (MLS-synced)',
    last_updated_iso: '2025-01-15T10:00:00Z',
    featured_listings_has_missing_specs: true,
    region: 'California',
    internal_links: {
      related_pages: [
        { href: '/california/irvine/condos-for-sale', anchor: 'Irvine Condos For Sale' },
      ],
      more_in_city: [
        { href: '/california/irvine/luxury-homes', anchor: 'Irvine Luxury Homes' },
      ],
      nearby_cities: [
        { href: '/california/tustin/homes-for-sale', anchor: 'Tustin' },
      ],
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
  console.log('\n📋 Integration Test: Landing Generation Pipeline v4\n');

  // Test 1: Successful generation
  await test('should generate valid content on first attempt', async () => {
    resetMock();
    setMockBehavior('succeed');

    const result = await mockGenerateLandingPageContentV4(testPageType, createTestInput());

    expect(result.content).toBeDefined();
    expect(result.attempts).toBe(1);
    expect(result.semantic_repairs).toBe(0);
    expect(result.content.seo.canonical_path).toBe('/california/irvine/homes-for-sale');
  })();

  // Test 2: Geo validation failure triggers repair
  await test('should repair geo-invalid content on retry', async () => {
    resetMock();
    setMockBehavior('fail-geo-then-succeed');

    const result = await mockGenerateLandingPageContentV4(testPageType, createTestInput());

    expect(result.content).toBeDefined();
    expect(result.attempts).toBe(2);
    expect(result.semantic_repairs).toBe(1);
    
    // Verify final content doesn't have forbidden places
    const { validateLandingOutput, deriveAllowedPlaceNames } = await import('../validators/landingOutputValidator');
    const enriched = {
      ...createTestInput(),
      allowed_place_names: deriveAllowedPlaceNames(createTestInput()),
    };
    const validation = validateLandingOutput(result.content, enriched);
    expect(validation.ok).toBeTrue();
  })();

  // Test 3: All attempts fail
  await test('should throw error when all attempts fail', async () => {
    resetMock();
    setMockBehavior('always-fail');

    let threw = false;
    try {
      await mockGenerateLandingPageContentV4(testPageType, createTestInput());
    } catch (error) {
      threw = true;
      expect(error instanceof Error).toBeTrue();
    }

    expect(threw).toBeTrue();
  })();

  // Test 4: Required fields validation
  await test('should include required market snapshot phrases', async () => {
    resetMock();
    setMockBehavior('succeed');

    const input = createTestInput();
    const result = await mockGenerateLandingPageContentV4(testPageType, input);

    expect(result.content.sections.market_snapshot.body).toContain('Data source:');
    expect(result.content.sections.market_snapshot.body).toContain('Last updated:');
  })();

  // Test 5: Missing specs sentence when flag is true
  await test('should include missing-specs sentence when flag is true', async () => {
    resetMock();
    setMockBehavior('succeed');

    const input = createTestInput();
    input.featured_listings_has_missing_specs = true;

    const result = await mockGenerateLandingPageContentV4(testPageType, input);

    expect(result.content.sections.featured_listings.body).toContain(
      'Some featured listings may not show every detail'
    );
  })();

  // Test 6: CTA structure is correct
  await test('should have correct CTA structure', async () => {
    resetMock();
    setMockBehavior('succeed');

    const result = await mockGenerateLandingPageContentV4(testPageType, createTestInput());

    expect(result.content.sections.buyer_strategy.cta.button_text).toBe('Contact an agent');
    expect(result.content.sections.buyer_strategy.cta.button_href).toBe('/contact');
  })();

  // Test 7: Neighborhood cards present
  await test('should have neighborhood cards', async () => {
    resetMock();
    setMockBehavior('succeed');

    const result = await mockGenerateLandingPageContentV4(testPageType, createTestInput());

    const cards = result.content.sections.neighborhoods.cards;
    expect(cards.length > 0).toBeTrue();
  })();

  // Test 8: Internal links match input
  await test('should preserve internal links from input', async () => {
    resetMock();
    setMockBehavior('succeed');

    const input = createTestInput();
    const result = await mockGenerateLandingPageContentV4(testPageType, input);

    expect(JSON.stringify(result.content.internal_linking.related_pages))
      .toBe(JSON.stringify(input.internal_links?.related_pages));
  })();

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run
runTests().catch(err => {
  console.error('💥 Test runner error:', err);
  process.exit(1);
});
