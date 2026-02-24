export interface ObservationConnectionSqlResponse {
  observation_connection_id: number;
  connection_id: string;
  observation_id: number;
  observation_title: string;
  observation_details: string;
}

export interface ObservationSQLResult {
  observation_id: number;
  observation_title: string;
  observation_details: string;
}

export interface ObservationConnectionSQLResult {
  observation_connection_id: number;
  connection_id: string;
  observation_id: number;
  register_date: string;
}
