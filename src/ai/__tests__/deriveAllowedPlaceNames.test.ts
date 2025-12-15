/**
 * Tests for deriveAllowedPlaceNames
 * ==================================
 * Unit tests for the place name allowlist derivation function.
 * 
 * Run with:
 *   npx ts-node --project tsconfig.scripts.json src/ai/__tests__/deriveAllowedPlaceNames.test.ts
 */

import { deriveAllowedPlaceNames } from '../validators/landingOutputValidator';
import type { InputJson } from '../landing';

// ============================================================================
// Test Helper
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain(item: unknown) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array, got ${typeof actual}`);
      }
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain "${item}", but it doesn't. Array: ${actual.slice(0, 10).join(', ')}...`);
      }
    },
    toContainCaseInsensitive(item: string) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array, got ${typeof actual}`);
      }
      const found = actual.some(
        (a: unknown) => typeof a === 'string' && a.toLowerCase() === item.toLowerCase()
      );
      if (!found) {
        throw new Error(`Expected array to contain "${item}" (case-insensitive)`);
      }
    },
    toHaveLength(length: number) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array, got ${typeof actual}`);
      }
      if (actual.length !== length) {
        throw new Error(`Expected array of length ${length}, got ${actual.length}`);
      }
    },
    toBeGreaterThan(min: number) {
      if (typeof actual !== 'number' || (Array.isArray(actual) && actual.length <= min)) {
        const len = Array.isArray(actual) ? actual.length : actual;
        throw new Error(`Expected ${len} to be greater than ${min}`);
      }
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

console.log('\n📋 Testing deriveAllowedPlaceNames\n');

// Test 1: Basic city and state
test('should include city name', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Irvine');
});

test('should include region', () => {
  const input: InputJson = {
    city: 'Irvine',
    region: 'California',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('California');
});

test('should include county if provided', () => {
  const input: InputJson = {
    city: 'Irvine',
    county: 'Orange County',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Orange County');
});

// Test 2: Internal link anchors
test('should include internal link anchors from related_pages', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    internal_links: {
      related_pages: [
        { href: '/california/irvine/condos-for-sale', anchor: 'Irvine Condos For Sale' },
        { href: '/california/irvine/luxury-homes', anchor: 'Irvine Luxury Homes' },
      ],
    },
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Irvine Condos For Sale');
  expect(result).toContain('Irvine Luxury Homes');
});

test('should include internal link anchors from nearby_cities', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    internal_links: {
      nearby_cities: [
        { href: '/california/tustin/homes-for-sale', anchor: 'Tustin' },
        { href: '/california/newport-beach/homes-for-sale', anchor: 'Newport Beach' },
      ],
    },
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Tustin');
  expect(result).toContain('Newport Beach');
});

// Test 3: Local areas
test('should include local area names', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    local_areas: [
      { name: 'Woodbridge' },
      { name: 'Turtle Rock' },
      { name: 'University Park' },
    ],
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Woodbridge');
  expect(result).toContain('Turtle Rock');
  expect(result).toContain('University Park');
});

// Test 4: Always-allowed names
test('should include brand name Crown Coastal Homes', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Crown Coastal Homes');
});

test('should include agent name Reza Barghlameno', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Reza Barghlameno');
});

// Test 5: No duplicates
test('should return unique values', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    internal_links: {
      related_pages: [
        { href: '/california/irvine/condos-for-sale', anchor: 'Irvine Condos' },
      ],
      nearby_cities: [
        { href: '/california/irvine/homes', anchor: 'Irvine' }, // Duplicate city name
      ],
    },
  };

  const result = deriveAllowedPlaceNames(input);
  
  // Count how many times 'Irvine' appears
  const irvineCount = result.filter(n => n === 'Irvine').length;
  expect(irvineCount).toBe(1);
});

// Test 6: Empty input handling
test('should handle minimal input without errors', () => {
  const input: InputJson = {
    city: '',
    canonical_path: '',
    data_source: '',
    last_updated_iso: '',
  };

  const result = deriveAllowedPlaceNames(input);
  
  // Should still include always-allowed names
  expect(result).toContain('Crown Coastal Homes');
  expect(result.length).toBeGreaterThan(0);
});

// Test 7: Existing allowed_place_names should be preserved
test('should preserve existing allowed_place_names', () => {
  const input: InputJson = {
    city: 'Irvine',
    canonical_path: '/california/irvine/homes-for-sale',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    allowed_place_names: ['Custom Place 1', 'Custom Place 2'],
  };

  const result = deriveAllowedPlaceNames(input);
  expect(result).toContain('Custom Place 1');
  expect(result).toContain('Custom Place 2');
});

// Test 8: Combined comprehensive test
test('should combine all sources correctly', () => {
  const input: InputJson = {
    city: 'San Diego',
    county: 'San Diego County',
    region: 'Southern California',
    canonical_path: '/california/san-diego/luxury-homes',
    data_source: 'MLS',
    last_updated_iso: new Date().toISOString(),
    local_areas: [
      { name: 'Downtown San Diego' },
      { name: 'La Jolla' },
    ],
    internal_links: {
      related_pages: [
        { href: '/california/san-diego/condos-for-sale', anchor: 'San Diego Condos' },
      ],
      more_in_city: [
        { href: '/california/san-diego/homes-with-pool', anchor: 'San Diego Pool Homes' },
      ],
      nearby_cities: [
        { href: '/california/coronado/homes-for-sale', anchor: 'Coronado' },
        { href: '/california/chula-vista/homes-for-sale', anchor: 'Chula Vista' },
      ],
    },
  };

  const result = deriveAllowedPlaceNames(input);

  // City and geography
  expect(result).toContain('San Diego');
  expect(result).toContain('San Diego County');
  expect(result).toContain('Southern California');

  // Local areas
  expect(result).toContain('Downtown San Diego');
  expect(result).toContain('La Jolla');

  // Internal links
  expect(result).toContain('San Diego Condos');
  expect(result).toContain('San Diego Pool Homes');
  expect(result).toContain('Coronado');
  expect(result).toContain('Chula Vista');

  // Always-allowed
  expect(result).toContain('Crown Coastal Homes');
  expect(result).toContain('California');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed > 0) {
  process.exit(1);
}
