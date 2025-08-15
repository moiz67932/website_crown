import { NextRequest, NextResponse } from 'next/server';

// Mock Daten - in einer echten Anwendung würden Sie diese aus einer Datenbank holen
const MOCK_CITIES = [
  { city: 'Los Angeles', county: 'Los Angeles County', state: 'CA' },
  { city: 'San Francisco', county: 'San Francisco County', state: 'CA' },
  { city: 'San Diego', county: 'San Diego County', state: 'CA' },
  { city: 'Sacramento', county: 'Sacramento County', state: 'CA' },
  { city: 'Oakland', county: 'Alameda County', state: 'CA' },
  { city: 'Orange', county: 'Orange County', state: 'CA' },
  { city: 'Fresno', county: 'Fresno County', state: 'CA' },
  { city: 'Long Beach', county: 'Los Angeles County', state: 'CA' },
  { city: 'Riverside', county: 'Riverside County', state: 'CA' },
  { city: 'Stockton', county: 'San Joaquin County', state: 'CA' },
  { city: 'Irvine', county: 'Orange County', state: 'CA' },
  { city: 'Anaheim', county: 'Orange County', state: 'CA' },
  { city: 'Santa Ana', county: 'Orange County', state: 'CA' },
  { city: 'San Jose', county: 'Santa Clara County', state: 'CA' },
  { city: 'Bakersfield', county: 'Kern County', state: 'CA' },
  { city: 'Fremont', county: 'Alameda County', state: 'CA' },
  { city: 'San Bernardino', county: 'San Bernardino County', state: 'CA' },
  { city: 'Modesto', county: 'Stanislaus County', state: 'CA' },
  { city: 'Oxnard', county: 'Ventura County', state: 'CA' },
  { city: 'Fontana', county: 'San Bernardino County', state: 'CA' },
];

const MOCK_COUNTIES = [
  'Los Angeles County',
  'Orange County', 
  'San Diego County',
  'Riverside County',
  'San Bernardino County',
  'Santa Clara County',
  'Alameda County',
  'Sacramento County',
  'Contra Costa County',
  'Fresno County',
  'Kern County',
  'Ventura County',
  'San Francisco County',
  'San Mateo County',
  'Sonoma County'
];

// Fuzzy search implementierung für bessere Matches
function fuzzyMatch(text: string, query: string): { score: number; highlights: number[] } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match bekommt höchste Priorität
  if (textLower === queryLower) {
    return { score: 100, highlights: [0, text.length] };
  }
  
  // Starts with match bekommt hohe Priorität
  if (textLower.startsWith(queryLower)) {
    return { score: 90, highlights: [0, query.length] };
  }
  
  // Contains match
  const containsIndex = textLower.indexOf(queryLower);
  if (containsIndex !== -1) {
    return { score: 80, highlights: [containsIndex, containsIndex + query.length] };
  }
  
  // Character-by-character fuzzy matching
  let score = 0;
  let textIndex = 0;
  let queryIndex = 0;
  const highlights: number[] = [];
  
  while (textIndex < text.length && queryIndex < query.length) {
    if (textLower[textIndex] === queryLower[queryIndex]) {
      if (highlights.length === 0 || highlights[highlights.length - 1] !== textIndex - 1) {
        highlights.push(textIndex);
      }
      highlights.push(textIndex + 1);
      score += 10;
      queryIndex++;
    }
    textIndex++;
  }
  
  // Alle Zeichen der Query gefunden?
  if (queryIndex === query.length) {
    score += 20;
    return { score, highlights };
  }
  
  return { score: 0, highlights: [] };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }
    
    const results: Array<{
      type: 'city' | 'county';
      value: string | { city: string; county: string };
      score: number;
      highlights?: number[];
    }> = [];
    
    // Suche in Städten (case-insensitive und fuzzy)
    MOCK_CITIES.forEach(cityData => {
      const cityMatch = fuzzyMatch(cityData.city, query);
      const countyMatch = fuzzyMatch(cityData.county, query);
      
      // Stadt match
      if (cityMatch.score > 0) {
        results.push({
          type: 'city',
          value: {
            city: cityData.city,
            county: cityData.county
          },
          score: cityMatch.score,
          highlights: cityMatch.highlights
        });
      }
      
      // County match (aber nur zurückgeben als Stadt result)
      if (countyMatch.score > 0 && cityMatch.score === 0) {
        results.push({
          type: 'city',
          value: {
            city: cityData.city,
            county: cityData.county
          },
          score: countyMatch.score * 0.8, // Etwas niedrigere Priorität
          highlights: countyMatch.highlights
        });
      }
    });
    
    // Suche in Counties
    MOCK_COUNTIES.forEach(county => {
      const match = fuzzyMatch(county, query);
      if (match.score > 0) {
        results.push({
          type: 'county',
          value: county,
          score: match.score,
          highlights: match.highlights
        });
      }
    });
    
    // Nach Score sortieren und limitieren
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score, highlights, ...rest }) => rest); // Score entfernen für Frontend
    
    return NextResponse.json(sortedResults);
    
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
