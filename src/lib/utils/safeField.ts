/**
 * Safe field utility for handling null/undefined property values
 * Used throughout the application to prevent displaying "0 beds / 0 baths / N/A" for missing data
 */

export function safeField(value: any, suffix?: string): string | null {
  // Check for null, undefined, empty string, 0, or "0"
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return null;
  }

  // Convert to string and append suffix if provided
  const stringValue = String(value);
  return suffix ? `${stringValue}${suffix}` : stringValue;
}

export function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === "" || isNaN(Number(value))) {
    return null;
  }
  const num = Number(value);
  return num === 0 ? null : num;
}

export function safeCurrency(value: any, includeSymbol: boolean = true): string | null {
  const num = safeNumber(value);
  if (num === null) return null;
  
  const formatted = num.toLocaleString("en-US");
  return includeSymbol ? `$${formatted}` : formatted;
}

export function safeSqft(value: any): string | null {
  const num = safeNumber(value);
  if (num === null) return null;
  
  return `${num.toLocaleString()} sqft`;
}

export function safeAcres(sqft: any): string | null {
  const num = safeNumber(sqft);
  if (num === null) return null;
  
  const SQFT_PER_ACRE = 43560;
  if (num >= SQFT_PER_ACRE) {
    const acres = (num / SQFT_PER_ACRE).toFixed(2);
    return `${acres} acres`;
  }
  
  return `${num.toLocaleString()} sqft`;
}

export function safeBeds(value: any): string | null {
  const num = safeNumber(value);
  if (num === null) return null;
  
  return `${num} ${num === 1 ? "bed" : "beds"}`;
}

export function safeBaths(value: any): string | null {
  const num = safeNumber(value);
  if (num === null) return null;
  
  return `${num} ${num === 1 ? "bath" : "baths"}`;
}

export function safeYear(value: any): string | null {
  const num = safeNumber(value);
  if (num === null || num < 1800 || num > new Date().getFullYear() + 2) {
    return null;
  }
  
  return String(num);
}

/**
 * Display placeholder when value is missing
 */
export function safeFieldWithPlaceholder(
  value: any,
  suffix?: string,
  placeholder: string = "—"
): string {
  const safe = safeField(value, suffix);
  return safe || placeholder;
}
