import {
  CustomerConnectionDto,
  CustomerDashboardResponseDto,
  CustomerProfileDto,
  CustomerRecentIncidentDto,
  CustomerSummaryDto,
} from '../../domain/schemas/dto/response/customer-dashboard.dto';

export class CustomerDashboardMapper {
  /**
   * Mapea la fila cruda devuelta por Postgres a nuestro DTO de dominio
   * @param rawData El objeto JSON extraído de la base de datos
   */
  static toDto(rawData: Record<string, unknown> | null): CustomerDashboardResponseDto | null {
    if (!rawData) return null;

    return {
      perfil: this.mapProfile(rawData.perfil as Record<string, unknown>),
      resumen: this.mapSummary(rawData.resumen as Record<string, unknown>),
      acometidas: this.mapConnections(rawData.acometidas as Record<string, unknown>[]),
      incidentes_recientes: this.mapIncidents(rawData.incidentes_recientes as Record<string, unknown>[]),
    };
  }

  // --- MÉTODOS PRIVADOS DE AYUDA ---

  private static mapProfile(perfilRaw: Record<string, unknown> | null): CustomerProfileDto {
    if (!perfilRaw) {
      return {
        client_id: '',
        is_company: false,
        name: 'Cliente sin nombre',
        document: '',
        emails: [],
        phones: [],
        address: '',
      };
    }

    const isCompany = Boolean(perfilRaw.company_id);
    let displayName = 'Cliente sin nombre';

    if (isCompany) {
      displayName = String(perfilRaw.business_name || perfilRaw.commercial_name || displayName);
    } else if (perfilRaw.first_name) {
      displayName = String(`${perfilRaw.first_name} ${perfilRaw.last_name || ''}`).trim();
    }

    return {
      client_id: String(perfilRaw.client_id || ''),
      is_company: isCompany,
      name: displayName,
      document: String(isCompany ? perfilRaw.ruc || '' : perfilRaw.client_id || ''),
      emails: Array.isArray(perfilRaw.emails) ? perfilRaw.emails.map(String) : [],
      phones: Array.isArray(perfilRaw.phones) ? perfilRaw.phones.map(String) : [],
      address: String(perfilRaw.address || ''),
    };
  }

  private static mapSummary(resumenRaw: Record<string, unknown> | null): CustomerSummaryDto {
    if (!resumenRaw) {
      return {
        total_acometidas: 0,
        acometidas_activas: 0,
        total_incidentes_reportados: 0,
      };
    }
    return {
      total_acometidas: Number(resumenRaw.total_acometidas) || 0,
      acometidas_activas: Number(resumenRaw.acometidas_activas) || 0,
      total_incidentes_reportados: Number(resumenRaw.total_incidentes_reportados) || 0,
    };
  }

  private static mapConnections(acometidasRaw: Record<string, unknown>[] | null): CustomerConnectionDto[] {
    if (!Array.isArray(acometidasRaw)) return [];

    return acometidasRaw.map((ac) => ({
      connection_id: String(ac.connection_id || ''),
      cadastral_key: String(ac.cadastral_key || ''),
      address: String(ac.address || 'Sin dirección registrada'),
      status: String(ac.status || 'DESCONOCIDO'),
      rate_name: String(ac.rate_name || 'SIN TARIFA'),
      meter_number: String(ac.meter_number || 'S/N'),
      has_sewerage: Boolean(ac.has_sewerage),
      last_readings: Array.isArray(ac.last_readings) ? ac.last_readings : [],
    }));
  }

  private static mapIncidents(incidentesRaw: Record<string, unknown>[] | null): CustomerRecentIncidentDto[] {
    if (!Array.isArray(incidentesRaw)) return [];

    return incidentesRaw.map((inc) => ({
      incident_code: String(inc.incident_code || ''),
      connection_id: String(inc.connection_id || ''),
      category: String(inc.category || ''),
      status: String(inc.status || ''),
      report_date: inc.report_date ? new Date(String(inc.report_date)) : new Date(),
    }));
  }
}
