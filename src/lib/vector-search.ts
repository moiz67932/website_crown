import { CleanedProperty } from './data-validation';

interface VectorEmbedding {
  listingKey: string;
  embedding: number[];
  text: string;
}

interface SearchResult {
  property: CleanedProperty;
  similarity: number;
}

/**
 * Simple vector-based semantic search for properties
 * Uses TF-IDF-like approach for text similarity
 */
export class PropertyVectorSearch {
  private embeddings: Map<string, VectorEmbedding> = new Map();
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();

  /**
   * Create text embedding for a property
   */
  private createPropertyText(property: CleanedProperty): string {
    const parts: string[] = [];

    // Basic info
    if (property.PropertyType) parts.push(property.PropertyType);
    if (property.PropertySubType) parts.push(property.PropertySubType);
    if (property.City) parts.push(property.City);
    if (property.StateOrProvince) parts.push(property.StateOrProvince);

    // Features
    if (property.PoolPrivateYN) parts.push('pool swimming');
    if (property.WaterfrontYN) parts.push('waterfront water view');
    if (property.ViewYN) parts.push('view scenic mountain ocean');
    if (property.isLuxury) parts.push('luxury premium high-end exclusive');

    // Size descriptions
    if (property.BedroomsTotal) {
      parts.push(`${property.BedroomsTotal} bedroom`);
      if (property.BedroomsTotal >= 4) parts.push('spacious large');
    }

    if (property.BathroomsTotalInteger) {
      parts.push(`${property.BathroomsTotalInteger} bathroom`);
    }

    if (property.LivingArea) {
      if (property.LivingArea > 3000) parts.push('spacious large');
      if (property.LivingArea > 5000) parts.push('mansion estate');
    }

    // Price descriptions
    if (property.ListPrice) {
      if (property.ListPrice < 200000) parts.push('affordable budget starter');
      else if (property.ListPrice < 500000) parts.push('moderate mid-range');
      else if (property.ListPrice < 1000000) parts.push('upscale premium');
      else parts.push('luxury high-end exclusive mansion');
    }

    // Year built descriptions
    if (property.YearBuilt) {
      const currentYear = new Date().getFullYear();
      if (currentYear - property.YearBuilt < 5) parts.push('new construction modern');
      else if (currentYear - property.YearBuilt < 20) parts.push('newer contemporary');
      else if (currentYear - property.YearBuilt > 50) parts.push('vintage historic character charm');
    }

    // Amenities
    if (property.GarageSpaces && property.GarageSpaces > 0) parts.push('garage parking');
    if (property.FireplacesTotal && property.FireplacesTotal > 0) parts.push('fireplace cozy');
    if (property.SpaYN) parts.push('spa hot tub relaxation');

    // Extract from remarks
    if (property.PublicRemarks) {
      const remarkWords = this.extractImportantWords(property.PublicRemarks);
      parts.push(...remarkWords);
    }

    // Keywords
    if (property.searchKeywords) {
      parts.push(...property.searchKeywords);
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * Extract important words from text
   */
  private extractImportantWords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const importantWords = [
      'updated', 'renovated', 'modern', 'new', 'stunning', 'beautiful', 'gorgeous', 'spectacular',
      'spacious', 'open', 'bright', 'airy', 'cozy', 'charming', 'elegant', 'sophisticated',
      'gourmet', 'chef', 'granite', 'marble', 'hardwood', 'tile', 'carpet', 'laminate',
      'stainless', 'appliances', 'upgraded', 'custom', 'built-in', 'cathedral', 'vaulted',
      'master', 'ensuite', 'walk-in', 'closet', 'deck', 'patio', 'balcony', 'terrace',
      'landscaped', 'fenced', 'private', 'quiet', 'peaceful', 'corner', 'lot', 'cul-de-sac',
      'near', 'close', 'walking', 'distance', 'schools', 'shopping', 'dining', 'entertainment',
      'transportation', 'downtown', 'beach', 'park', 'golf', 'tennis', 'club', 'resort'
    ];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !stopWords.has(word) && 
        (importantWords.includes(word) || /^[0-9]+$/.test(word))
      );
  }

  /**
   * Create TF-IDF vector from text
   */
  private createVector(text: string): number[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const termFreq = new Map<string, number>();

    // Calculate term frequency
    words.forEach(word => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    // Create vector based on vocabulary
    const vector: number[] = [];
    this.vocabulary.forEach((index, term) => {
      const tf = (termFreq.get(term) || 0) / words.length;
      const idf = this.idf.get(term) || 0;
      vector[index] = tf * idf;
    });

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.max(vectorA.length, vectorB.length); i++) {
      const a = vectorA[i] || 0;
      const b = vectorB[i] || 0;
      
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Index properties for vector search
   */
  indexProperties(properties: CleanedProperty[]): void {
    console.log(`🔍 Indexing ${properties.length} properties for vector search...`);

    // Reset
    this.embeddings.clear();
    this.vocabulary.clear();
    this.idf.clear();

    // Build vocabulary and calculate document frequency
    const documentFreq = new Map<string, number>();
    const propertyTexts = new Map<string, string>();

    properties.forEach(property => {
      const text = this.createPropertyText(property);
      propertyTexts.set(property.ListingKey, text);

      const words = new Set(text.split(/\s+/).filter(word => word.length > 0));
      words.forEach(word => {
        documentFreq.set(word, (documentFreq.get(word) || 0) + 1);
      });
    });

    // Build vocabulary (only words that appear in at least 2 documents but less than 80% of documents)
    let vocabIndex = 0;
    documentFreq.forEach((freq, word) => {
      if (freq >= 2 && freq < properties.length * 0.8) {
        this.vocabulary.set(word, vocabIndex++);
      }
    });

    // Calculate IDF scores
    this.vocabulary.forEach((index, term) => {
      const df = documentFreq.get(term) || 1;
      const idf = Math.log(properties.length / df);
      this.idf.set(term, idf);
    });

    // Create embeddings for each property
    properties.forEach(property => {
      const text = propertyTexts.get(property.ListingKey)!;
      const embedding = this.createVector(text);
      
      this.embeddings.set(property.ListingKey, {
        listingKey: property.ListingKey,
        embedding,
        text
      });
    });

    console.log(`✅ Vector search index created with ${this.vocabulary.size} terms`);
  }

  /**
   * Search properties using natural language query
   */
  searchProperties(
    query: string, 
    properties: CleanedProperty[], 
    limit: number = 10,
    minSimilarity: number = 0.1
  ): SearchResult[] {
    if (this.embeddings.size === 0) {
      console.log('⚠️ Vector index is empty, rebuilding...');
      this.indexProperties(properties);
    }

    // Create query vector
    const queryText = query.toLowerCase();
    const queryVector = this.createVector(queryText);

    // Calculate similarities
    const results: SearchResult[] = [];

    properties.forEach(property => {
      const embedding = this.embeddings.get(property.ListingKey);
      if (embedding) {
        const similarity = this.cosineSimilarity(queryVector, embedding.embedding);
        
        if (similarity >= minSimilarity) {
          results.push({
            property,
            similarity
          });
        }
      }
    });

    // Sort by similarity and return top results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Find similar properties to a given property
   */
  findSimilarProperties(
    targetProperty: CleanedProperty,
    allProperties: CleanedProperty[],
    limit: number = 5
  ): SearchResult[] {
    const targetEmbedding = this.embeddings.get(targetProperty.ListingKey);
    if (!targetEmbedding) return [];

    const results: SearchResult[] = [];

    allProperties.forEach(property => {
      if (property.ListingKey === targetProperty.ListingKey) return; // Skip self

      const embedding = this.embeddings.get(property.ListingKey);
      if (embedding) {
        const similarity = this.cosineSimilarity(targetEmbedding.embedding, embedding.embedding);
        
        results.push({
          property,
          similarity
        });
      }
    });

    // Sort by similarity and return top results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSearchSuggestions(partialQuery: string, limit: number = 5): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Find terms in vocabulary that start with the query
    this.vocabulary.forEach((index, term) => {
      if (term.startsWith(query) && term !== query) {
        suggestions.add(term);
      }
    });

    // Find terms that contain the query
    if (suggestions.size < limit) {
      this.vocabulary.forEach((index, term) => {
        if (term.includes(query) && term !== query && !term.startsWith(query)) {
          suggestions.add(term);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get statistics about the vector index
   */
  getIndexStats(): {
    totalProperties: number;
    vocabularySize: number;
    averageVectorLength: number;
  } {
    const vectors = Array.from(this.embeddings.values());
    const averageLength = vectors.length > 0 
      ? vectors.reduce((sum, emb) => sum + emb.embedding.length, 0) / vectors.length 
      : 0;

    return {
      totalProperties: this.embeddings.size,
      vocabularySize: this.vocabulary.size,
      averageVectorLength: averageLength
    };
  }
}

// Singleton instance
let vectorSearchInstance: PropertyVectorSearch | null = null;

export function getPropertyVectorSearch(): PropertyVectorSearch {
  if (!vectorSearchInstance) {
    vectorSearchInstance = new PropertyVectorSearch();
  }
  return vectorSearchInstance;
}
