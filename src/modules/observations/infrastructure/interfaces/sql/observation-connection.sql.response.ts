export interface ObservationConnectionSqlResponse {
  observationConnectionId: number;
  connectionId: string;
  observationId: number;
  observationTitle: string;
  observationDetails: string;
}


export interface ObservationSQLResult {
  observationId: number
  observationTitle: string;
  observationDetails: string;
}

export interface ObservationConnectionSQLResult {
  observationConnectionId: number
  connectionId: string
  observationId: number
  registerDate: string;
}