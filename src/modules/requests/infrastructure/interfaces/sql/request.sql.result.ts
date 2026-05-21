export interface RequestSqlResult {
  request_id: string;
  client_id: string;
  person_type: string;
  connection_type: string;
  property_use: string;
  address: string;
  cadastral_key: string;
  geom: string | null;
  status: string;
  additional_info: Record<string, any>;
  analystic_id: string | null;
  created_at: Date;
  updated_at: Date;
}
