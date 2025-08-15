export interface TrestleProperty {
  ListingKey: string;
  ListPrice?: number;
  UnparsedAddress?: string;
  StandardStatus?: string;
  PropertyType?: string;
  PropertySubType?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  ListingContractDate?: string;
  ModificationTimestamp?: string;
  OnMarketDate?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  Country?: string;
  Latitude?: number;
  Longitude?: number;
  ListingId?: string;
  MlsStatus?: string;
  PhotosCount?: number;
  PublicRemarks?: string;
  PrivateRemarks?: string;
  ListAgentFullName?: string;
  ListOfficeName?: string;
  ParkingTotal?: number;
  GarageSpaces?: number;
  FireplacesTotal?: number;
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  ViewYN?: boolean;
  CoolingYN?: boolean;
  HeatingYN?: boolean;
  InternetYN?: boolean;
  SpaYN?: boolean;
  DaysOnMarket?: number;
  OriginalListPrice?: number;
  PriceChangeTimestamp?: string;
  CloseDate?: string;
  ClosePrice?: number;
  CumulativeDaysOnMarket?: number;
  AssociationFee?: number;
  TaxAnnualAmount?: number;
  WalkScore?: number;
  SchoolDistrictName?: string;
  ElementarySchoolName?: string;
  MiddleOrJuniorSchoolName?: string;
  HighSchoolName?: string;
}

export interface TrestleResponse {
  '@odata.context': string;
  '@odata.count'?: number;
  value: TrestleProperty[];
  '@odata.nextLink'?: string;
  '@reso.context'?: string;
}

export interface TrestleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface TrestleApiConfig {
  apiId: string;
  apiPassword: string;
  baseUrl: string;
  oauthUrl: string;
}

export class TrestleApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'TrestleApiError';
  }
}
