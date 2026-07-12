// ==============================================================================
// 1. DTOs / MODELOS - DASHBOARD DEL CLIENTE
// ==============================================================================

export class CustomerDashboardResponseDto {
  perfil: CustomerProfileDto;
  resumen: CustomerSummaryDto;
  acometidas: CustomerConnectionDto[];
  incidentes_recientes: CustomerRecentIncidentDto[];
}

export class CustomerProfileDto {
  client_id: string;
  is_company: boolean;
  name: string; // Nombre completo (Persona) o Razón Social (Empresa)
  document: string; // Cédula o RUC
  emails: string[];
  phones: string[];
  address: string;
}

export class CustomerSummaryDto {
  total_acometidas: number;
  acometidas_activas: number;
  total_incidentes_reportados: number;
}

export class CustomerConnectionDto {
  connection_id: string;
  cadastral_key: string;
  address: string;
  status: string;
  rate_name: string;
  meter_number: string;
  has_sewerage: boolean;
  last_readings: any[]; // Aquí pones tu DTO de lecturas si ya lo tienes
}

export class CustomerRecentIncidentDto {
  incident_code: string;
  connection_id: string;
  category: string;
  status: string;
  report_date: Date;
}
