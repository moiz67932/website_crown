/**
 * Curated local facts for California cities
 * Hand-authored content that provides true differentiation
 * This data should be maintained by local experts / agents
 */

export interface LocalFacts {
  // Common buyer constraints specific to this city
  buyerConstraints: string[];

  // Major employment/commute destinations
  commuterAnchors: string[];

  // Local process quirks (disclosure norms, permit issues, etc.)
  processQuirks: string[];

  // Market positioning (what this city is known for)
  marketPosition: string;

  // Seasonal patterns (if any)
  seasonalNotes?: string;
}

/**
 * Curated facts database
 * Add entries for each city you want to generate content for
 */
const LOCAL_FACTS_DB: Record<string, LocalFacts> = {
  'san francisco': {
    buyerConstraints: [
      'Most condos have HOA fees ranging $500-$1,500/month - always review HOA financials',
      'TIC (Tenancy in Common) properties require special financing and have resale limitations',
      'Many buildings have rental restrictions - verify if investment use is allowed',
      'Older buildings (pre-1978) may have rent control implications for future rental',
      'Parking is often sold separately or not included - budget $50K-$150K for a spot',
    ],
    commuterAnchors: [
      'Financial District / Downtown',
      'South of Market (SoMa) tech corridor',
      'Mission Bay / UCSF',
      'Salesforce / Transbay area',
    ],
    processQuirks: [
      'SF requires a Transfer Tax (0.5%-2.5% based on price) paid by buyer or split',
      'Mandatory seismic and energy disclosures required for most sales',
      '3-R Report required for all residential sales (permits, zoning, code compliance)',
      'Lead paint and asbestos disclosures common in pre-1978 buildings',
    ],
    marketPosition: 'Dense urban market with premium pricing, strong condo inventory, limited single-family homes',
    seasonalNotes: 'Spring (March-May) typically sees highest inventory; tech layoffs can create buying opportunities',
  },

  'san diego': {
    buyerConstraints: [
      'Mello-Roos taxes common in newer communities - can add $3K-$10K annually',
      'Coastal properties may have California Coastal Commission restrictions',
      'HOA fees in beach communities often include exterior maintenance and insurance',
      'Many condos have age restrictions (55+) - verify before touring',
      'Flood insurance may be required in low-lying coastal and river-adjacent areas',
    ],
    commuterAnchors: [
      'Downtown San Diego',
      'UTC / La Jolla tech corridor',
      'Sorrento Valley biotech hub',
      'Naval Base San Diego / military installations',
    ],
    processQuirks: [
      'San Diego has a relatively buyer-friendly disclosure process',
      'Termite inspections (Section 1) traditionally paid by seller',
      'Natural Hazard Disclosure required for all sales',
      'Some areas require geological hazard reports',
    ],
    marketPosition: 'Diverse market from beach condos to inland family homes, strong military and biotech buyer base',
    seasonalNotes: 'Year-round market with slight uptick in spring; military PCS season (summer) affects certain areas',
  },

  'los angeles': {
    buyerConstraints: [
      'LA has a Mansion Tax (4% on $5M+, 5.5% on $10M+) effective April 2023',
      'Rent Stabilization Ordinance (RSO) affects multi-family properties built before 1978',
      'Hillside properties often have geological and fire hazard requirements',
      'ADU potential varies dramatically by zone - verify before assuming rental income',
      'Street parking permits required in many neighborhoods',
    ],
    commuterAnchors: [
      'Downtown LA',
      'West LA / Century City',
      'Hollywood / Entertainment industry hubs',
      'Silicon Beach (Playa Vista, Santa Monica, Venice)',
    ],
    processQuirks: [
      'LA City has specific retrofit requirements for soft-story buildings',
      'Pool/spa compliance certificates required at close of escrow',
      'Certificate of Compliance for building permits often required',
      'LA requires seller to provide utility retrofit compliance',
    ],
    marketPosition: 'Massive diverse market spanning luxury estates to entry-level condos, entertainment industry influence',
    seasonalNotes: 'Awards season (Jan-Mar) can affect luxury market; pilot season brings rental demand',
  },

  'irvine': {
    buyerConstraints: [
      'Nearly all Irvine properties have HOA fees ($200-$800/month typical)',
      'Many communities have strict architectural guidelines and modification restrictions',
      'Irvine Company master HOA fees are in addition to sub-HOA fees',
      'Age restrictions common in certain villages (55+)',
      'Solar lease transfers can complicate transactions',
    ],
    commuterAnchors: [
      'Irvine Spectrum',
      'John Wayne Airport business corridor',
      'UCI (University of California, Irvine)',
      'Newport Beach / Costa Mesa',
    ],
    processQuirks: [
      'Irvine has mandatory HOA document review period (typically 3-5 days)',
      'Master-planned community rules may restrict rentals',
      'High-quality schools drive premium pricing in certain villages',
      'Builder warranty transfers may require registration',
    ],
    marketPosition: 'Master-planned community known for safety, schools, and family-friendly environment; premium pricing',
    seasonalNotes: 'School calendar heavily influences family buyer timing; UCI academic calendar affects rental market',
  },

  'oakland': {
    buyerConstraints: [
      'Oakland has a Progressive Real Estate Transfer Tax (1.5%-2.5%)',
      'Rent control applies to buildings built before 1983 (Oakland RAP)',
      'Just Cause for Eviction ordinance affects landlord rights',
      'Some areas have high fire insurance premiums (hills)',
      'Soft-story retrofit requirements for certain multi-family buildings',
    ],
    commuterAnchors: [
      'Downtown Oakland',
      'Jack London Square',
      'Emeryville corridor',
      'BART access to SF (12-15 min to downtown)',
    ],
    processQuirks: [
      'Oakland requires Residential Rental Property Business License for rentals',
      'Seismic retrofit requirements for soft-story buildings',
      'Lead paint disclosure critical for pre-1978 homes',
      'Some areas require geological hazard reports (hills)',
    ],
    marketPosition: 'Urban market with strong SF commuter appeal, rapidly gentrifying neighborhoods, diverse housing stock',
    seasonalNotes: 'Follows SF market trends with slight lag; tech hiring cycles affect demand',
  },

  'la jolla': {
    buyerConstraints: [
      'Coastal Commission restrictions affect many properties near the water',
      'Bluff-top homes may have erosion concerns requiring geological reports',
      'HOA fees in luxury buildings can exceed $2,000/month',
      'Short-term rental restrictions in many areas',
      'Historic designation in Village area limits modifications',
    ],
    commuterAnchors: [
      'UC San Diego / Scripps Institution',
      'La Jolla Village / UTC area',
      'Torrey Pines Science Park',
      'Downtown San Diego (20-30 min)',
    ],
    processQuirks: [
      'Coastal Development Permits may be required for exterior modifications',
      'La Jolla Community Planning Association reviews many projects',
      'Parking is extremely limited in Village area',
      'View preservation ordinances in some areas',
    ],
    marketPosition: 'Premium coastal market with strong academic and biotech influence, limited inventory, luxury focus',
    seasonalNotes: 'Summer brings increased buyer activity; academic calendar influences rental market near UCSD',
  },

  'orange': {
    buyerConstraints: [
      'Historic Old Towne district has strict preservation requirements',
      'Many older homes lack modern updates - budget for renovations',
      'HOA communities have varying rental and modification restrictions',
      'Some areas have Mello-Roos taxes from original development',
      'Pool homes command premium but require ongoing maintenance',
    ],
    commuterAnchors: [
      'Orange Circle / Old Towne',
      'Chapman University',
      'Angel Stadium / Honda Center area',
      'Anaheim employment centers',
    ],
    processQuirks: [
      'Historic district homes require design review for exterior changes',
      'Septic systems still exist in some older areas',
      'Chapman University proximity affects rental demand',
      'City has active code enforcement',
    ],
    marketPosition: 'Charming historic downtown with suburban family neighborhoods, strong community identity',
    seasonalNotes: 'Chapman University academic calendar affects rental market; spring is peak buying season',
  },

  'san jose': {
    buyerConstraints: [
      'Property taxes can be high due to Prop 13 reassessment on purchase',
      'Many areas have Mello-Roos taxes from infrastructure bonds',
      'Older homes may have knob-and-tube wiring requiring upgrades',
      'Accessory Dwelling Unit (ADU) regulations are evolving',
      'Flood zones exist near Guadalupe River and Coyote Creek',
    ],
    commuterAnchors: [
      'Downtown San Jose',
      'North San Jose tech corridor',
      'Santana Row / Valley Fair area',
      'Caltrain access to SF Peninsula',
    ],
    processQuirks: [
      'San Jose has a Real Property Transfer Tax',
      'Rent control applies to certain multi-family buildings',
      'Seismic retrofit requirements for some older buildings',
      'Solar installation incentives available',
    ],
    marketPosition: 'Tech-driven market with wide price range, strong demand from industry workers, diverse neighborhoods',
    seasonalNotes: 'Tech company stock vesting schedules (especially Q1) can create buying surges',
  },

  'sacramento': {
    buyerConstraints: [
      'Flood insurance required in many areas near rivers',
      'Older homes (1950s-1970s) may have foundation issues',
      'HOA fees vary widely - some include flood insurance',
      'Mello-Roos common in newer suburban developments',
      'Air conditioning is essential - verify HVAC condition',
    ],
    commuterAnchors: [
      'State Capitol / Downtown',
      'UC Davis Medical Center',
      'McClellan Business Park',
      'Roseville / Folsom employment centers',
    ],
    processQuirks: [
      'Sacramento has relatively buyer-friendly closing costs',
      'Pest inspection (Section 1) traditionally seller-paid',
      'Flood zone disclosure is critical',
      'Some areas require well and septic inspections',
    ],
    marketPosition: 'Affordable alternative to Bay Area with government and healthcare employment base, growing tech presence',
    seasonalNotes: 'Summer heat affects showing activity; spring is most active season',
  },

  'fresno': {
    buyerConstraints: [
      'Many properties are on well water - verify water rights and quality',
      'Older ag properties may have septic systems',
      'Air quality concerns in summer - verify HVAC filtration',
      'Flood zones exist near rivers and irrigation canals',
      'Agricultural zoning may restrict property use',
    ],
    commuterAnchors: [
      'Downtown Fresno',
      'Community Regional Medical Center',
      'Fresno State University',
      'Fig Garden area',
    ],
    processQuirks: [
      'Well water testing required for many sales',
      'Septic inspection and certification may be required',
      'Agricultural disclosure for properties near farms',
      'Pest inspection important in Central Valley',
    ],
    marketPosition: 'Affordable Central Valley market with agricultural heritage, growing healthcare and education sectors',
    seasonalNotes: 'Summer heat limits showing activity; fall and spring are most active seasons',
  },

  'long beach': {
    buyerConstraints: [
      'Port-adjacent properties may have noise and air quality concerns',
      'Many condos have oil lease implications from historic drilling',
      'Rent control applies to certain residential buildings',
      'Parking is limited in beach-adjacent areas',
      'Some areas have subsidence issues from historic oil extraction',
    ],
    commuterAnchors: [
      'Port of Long Beach',
      'Downtown Long Beach',
      'Cal State Long Beach',
      'Aerospace corridor (Boeing, Relativity)',
    ],
    processQuirks: [
      'Long Beach has a Transfer Tax',
      'Oil lease disclosure required for many properties',
      'Rent control and Just Cause ordinances in effect',
      'Coastal Commission jurisdiction near shore',
    ],
    marketPosition: 'Diverse urban market with beach lifestyle, port industry, and arts scene; more affordable than LA',
    seasonalNotes: 'Year-round market with summer beach premium; Grand Prix weekend (April) affects Downtown',
  },

  'beverly hills': {
    buyerConstraints: [
      'Luxury property insurance can be difficult to obtain and expensive',
      'Many properties require extensive security systems',
      'HOA fees in luxury buildings can exceed $3,000/month',
      'Historic designation may limit modifications',
      'Hillside properties may have geological concerns',
    ],
    commuterAnchors: [
      'Beverly Hills Business District',
      'Century City adjacent',
      'Hollywood entertainment industry',
      'Westside employment centers',
    ],
    processQuirks: [
      'Beverly Hills has strict building and zoning codes',
      'Design review required for many exterior modifications',
      'Privacy concerns affect showing and inspection access',
      'High net worth buyer verification common',
    ],
    marketPosition: 'Ultra-luxury market with global buyer base, entertainment industry influence, prestige location',
    seasonalNotes: 'Awards season and pilot season affect buyer activity; summer sees international buyer interest',
  },

  'pasadena': {
    buyerConstraints: [
      'Historic Landmark District has strict preservation requirements',
      'Many Craftsman homes need specialized maintenance',
      'Older homes may have foundation issues due to soil conditions',
      'Hillside properties have fire and geological hazards',
      'Parking is limited near Old Town and Caltech',
    ],
    commuterAnchors: [
      'Old Town Pasadena',
      'Caltech / JPL',
      'Rose Bowl area',
      'Gold Line Metro to Downtown LA',
    ],
    processQuirks: [
      'Historic district properties require design review',
      'Seismic retrofit requirements for older buildings',
      'Craftsman home buyers should budget for specialized repairs',
      'Pasadena has specific solar installation guidelines',
    ],
    marketPosition: 'Historic character with cultural amenities, strong academic presence, distinct from LA proper',
    seasonalNotes: 'Rose Parade season (December-January) affects market activity; spring is peak season',
  },

  'santa monica': {
    buyerConstraints: [
      'Coastal Commission restrictions affect many properties',
      'Rent control is strict - affects investment potential',
      'HOA fees in beach-adjacent buildings can exceed $1,500/month',
      'Parking is extremely limited and valuable',
      'Short-term rental restrictions (Airbnb largely prohibited)',
    ],
    commuterAnchors: [
      'Downtown Santa Monica / Promenade',
      'Silicon Beach tech companies',
      'Santa Monica Pier / beach area',
      'Expo Line to Downtown LA',
    ],
    processQuirks: [
      'Santa Monica has a Real Estate Transfer Tax',
      'Rent control is among strictest in California',
      'Coastal Development Permits required for many changes',
      'Santa Monica has its own school district (SMMUSD)',
    ],
    marketPosition: 'Premium beachside market with tech industry influence, lifestyle focus, limited inventory',
    seasonalNotes: 'Summer sees peak beach-lifestyle buyer interest; year-round demand from tech workers',
  },

  'newport beach': {
    buyerConstraints: [
      'Coastal Commission restrictions affect waterfront properties',
      'HOA fees in harbor communities can exceed $1,000/month',
      'Dock rights and boat slip availability vary by property',
      'Flood insurance required for many waterfront properties',
      'Short-term rental restrictions in residential areas',
    ],
    commuterAnchors: [
      'Fashion Island / Newport Center',
      'John Wayne Airport corridor',
      'Irvine business centers',
      'Corona del Mar',
    ],
    processQuirks: [
      'Harbor permits and dock rights transfer with property',
      'Coastal Development Permits for waterfront modifications',
      'High insurance requirements for waterfront properties',
      'Seawall and bulkhead maintenance responsibilities',
    ],
    marketPosition: 'Affluent coastal community with boating lifestyle, strong family orientation, premium schools',
    seasonalNotes: 'Summer brings peak activity for waterfront properties; boating season drives harbor home interest',
  },

  'anaheim': {
    buyerConstraints: [
      'Disney-adjacent areas have tourism traffic and noise considerations',
      'Older homes (1950s-1970s) may need significant updates',
      'Some areas have Mello-Roos taxes',
      'Resort area properties may have short-term rental potential',
      'HOA restrictions vary widely by community',
    ],
    commuterAnchors: [
      'Disneyland Resort',
      'Anaheim Convention Center',
      'Angel Stadium / Honda Center',
      'Platinum Triangle',
    ],
    processQuirks: [
      'Resort district has special zoning considerations',
      'Older areas may have unpermitted additions',
      'Short-term rental permits available in some zones',
      'Traffic impact from theme parks is significant',
    ],
    marketPosition: 'Diverse market from tourist-area condos to suburban family homes, entertainment industry employment',
    seasonalNotes: 'Tourism calendar affects resort-area properties; summer is peak for family relocation',
  },

  'huntington beach': {
    buyerConstraints: [
      'Coastal Commission jurisdiction affects beach-adjacent properties',
      'HOA fees in beach communities can be substantial',
      'Flood insurance required in many coastal areas',
      'Oil well remediation may be required on some properties',
      'Short-term rental restrictions in residential zones',
    ],
    commuterAnchors: [
      'Downtown Huntington Beach / Main Street',
      'Huntington Beach Pier area',
      'Bella Terra / Beach Boulevard corridor',
      'Boeing / aerospace employers',
    ],
    processQuirks: [
      'Coastal Development Permits for many beach-area modifications',
      'Oil lease disclosure required for some properties',
      'Surf City identity drives lifestyle-focused market',
      'Beach proximity commands significant premium',
    ],
    marketPosition: 'Surf culture community with strong beach lifestyle, diverse housing from cottages to luxury',
    seasonalNotes: 'Summer surf season peaks buyer interest; US Open of Surfing (July-August) highlights area',
  },
};

/**
 * Get local facts for a city
 * Returns null if no curated facts exist (AI should use more generic approach)
 */
export function getLocalFacts(city: string): LocalFacts | null {
  const normalizedCity = city.toLowerCase().trim();
  return LOCAL_FACTS_DB[normalizedCity] || null;
}

/**
 * Format local facts for AI input
 */
export function formatLocalFactsForAI(facts: LocalFacts): Record<string, unknown> {
  return {
    local_buyer_constraints: facts.buyerConstraints,
    commuter_anchors: facts.commuterAnchors,
    local_process_quirks: facts.processQuirks,
    market_position: facts.marketPosition,
    ...(facts.seasonalNotes && { seasonal_notes: facts.seasonalNotes }),
  };
}

/**
 * Get all cities with curated facts
 */
export function getCitiesWithLocalFacts(): string[] {
  return Object.keys(LOCAL_FACTS_DB);
}

/**
 * Add or update local facts for a city
 * (Could be wired to an admin interface)
 */
export function setLocalFacts(city: string, facts: LocalFacts): void {
  LOCAL_FACTS_DB[city.toLowerCase().trim()] = facts;
}
