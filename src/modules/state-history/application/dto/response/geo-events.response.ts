export interface GeoJSONFeature {
  type: 'Feature';
  geometry: Record<string, unknown>;
  properties: {
    historialId: number;
    connectionId: string;
    sector: number | null;
    stateId: number;
    stateName: string;
    effectiveDate: string;
    reason: string | null;
    supportDocument: string | null;
  };
}

export interface StateEventsGeoJSONResponse {
  type: 'FeatureCollection';
  totalFeatures: number;
  features: GeoJSONFeature[];
}
