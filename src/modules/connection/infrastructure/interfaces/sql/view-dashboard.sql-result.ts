export interface ClientDashboardSqlResult {
  client_id: string;
  identification: string;
  client_name: string;
  client_type: string;
  total_connections: string | number;
  active_connections: string | number;
  installed_meters: string | number;
  with_sewer_service: string | number;
  reading_history_count: string | number;
  average_consumption_m3: string | number;
  last_reading_date: string;
  total_requests: string | number;
  pending_requests: string | number;
  total_work_orders: string | number;
  active_work_orders: string | number;
  total_incidents: string | number;
  pending_incidents: string | number;
  invoice_count: string | number;
  total_invoiced_amount: string | number;
  current_debt_amount: string | number;
  financial_health_status: string;
  consumption_profile: string;
  client_since_date: string;
}

export interface ConnectionDashboardSqlResult {
  connection_id: string;
  cadastral_key: string;
  connection_status: string;
  has_sewer_service: string;
  latitude: string | null;
  longitude: string | null;
  client_id: string;
  client_identification: string;
  responsible_client: string;
  address: string;
  physical_meter_serial: string;
  meter_brand: string;
  diameter_mm: string | number;
  total_readings_count: string | number;
  last_consumption_m3: string | number;
  historical_average_m3: string | number;
  last_reading_date: string;
  history_last_12_readings: Array<{
    date: string;
    previous_reading: string | number;
    current_reading: string | number;
    consumption_m3: string | number;
    anomaly_novelty: string | null;
  }>;
  total_incidents_count: string | number;
  pending_incidents_count: string | number;
  details_last_incidents: Array<{
    report_date: string;
    status: string;
    description: string;
    priority: string;
  }>;
  automatic_alert: string;
}
