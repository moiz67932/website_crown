/**
 * Utility Funktionen für verbesserte Suchfunktionalität
 */
import React from 'react';

export interface SearchResult {
  score: number;
  item: any;
  highlights: Array<{ start: number; end: number }>;
}

/**
 * Case-insensitive fuzzy search mit Scoring
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string[]
): SearchResult[] {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  items.forEach((item) => {
    const searchTexts = getSearchableText(item);
    let bestScore = 0;
    let bestHighlights: Array<{ start: number; end: number }> = [];

    searchTexts.forEach((text) => {
      const { score, highlights } = calculateMatch(text, queryLower);
      if (score > bestScore) {
        bestScore = score;
        bestHighlights = highlights;
      }
    });

    if (bestScore > 0) {
      results.push({
        score: bestScore,
        item,
        highlights: bestHighlights,
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Berechnet Match-Score und Highlights für einen Text
 */
function calculateMatch(
  text: string,
  query: string
): { score: number; highlights: Array<{ start: number; end: number }> } {
  const textLower = text.toLowerCase();
  
  // Exact match bekommt höchste Priorität
  if (textLower === query) {
    return { 
      score: 100, 
      highlights: [{ start: 0, end: text.length }] 
    };
  }
  
  // Starts with match bekommt hohe Priorität
  if (textLower.startsWith(query)) {
    return { 
      score: 90, 
      highlights: [{ start: 0, end: query.length }] 
    };
  }
  
  // Contains match
  const containsIndex = textLower.indexOf(query);
  if (containsIndex !== -1) {
    return { 
      score: 80, 
      highlights: [{ start: containsIndex, end: containsIndex + query.length }] 
    };
  }
  
  // Character-by-character fuzzy matching
  let score = 0;
  let textIndex = 0;
  let queryIndex = 0;
  const highlights: Array<{ start: number; end: number }> = [];
  let currentHighlight: { start: number; end: number } | null = null;
  
  while (textIndex < text.length && queryIndex < query.length) {
    if (textLower[textIndex] === query[queryIndex]) {
      if (!currentHighlight) {
        currentHighlight = { start: textIndex, end: textIndex + 1 };
      } else {
        currentHighlight.end = textIndex + 1;
      }
      score += 10;
      queryIndex++;
    } else {
      if (currentHighlight) {
        highlights.push(currentHighlight);
        currentHighlight = null;
      }
    }
    textIndex++;
  }
  
  if (currentHighlight) {
    highlights.push(currentHighlight);
  }
  
  // Alle Zeichen der Query gefunden?
  if (queryIndex === query.length) {
    score += 20;
    return { score, highlights };
  }
  
  return { score: 0, highlights: [] };
}

/**
 * Highlightet Text basierend auf Suchquery
 */
export function highlightMatches(
  text: string,
  query: string,
  className: string = "bg-yellow-200 font-semibold text-orange-800"
): React.ReactNode {
  if (!query.trim()) return text;
  
  try {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        React.createElement('span', { key: index, className: className }, part)
      ) : part
    );
  } catch (error) {
    // Fallback bei ungültiger Regex
    return text;
  }
}

/**
 * Debounced search hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Normalisiert Suchtext für bessere Matches
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces zu einzelnem space
    .replace(/[^\w\s]/g, ''); // Sonderzeichen entfernen
}

/**
 * Extrahiert suchbare Keywords aus Text
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeSearchText(text);
  const words = normalized.split(/\s+/).filter(word => word.length > 1);
  
  // Auch Teilstrings für bessere Matches
  const keywords = new Set(words);
  words.forEach(word => {
    if (word.length > 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        keywords.add(word.substring(i, i + 3));
      }
    }
  });
  
  return Array.from(keywords);
}
