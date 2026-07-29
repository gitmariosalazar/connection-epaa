import {
  ClientDashboardResponse,
  ConnectionDashboardResponse,
} from '../../domain/schemas/dto/response/view-dashboard.response';
import { ClientDashboardSqlResult } from '../interfaces/sql/view-dashboard.sql-result';
import { ConnectionDashboardSqlResult } from '../interfaces/sql/view-dashboard.sql-result';
export class DashboardViewAdapter {
  /**
   * Adapts raw SQL results from dashboard_clientes.sql into structured Response DTOs
   */
  static toClientDashboardResponse(
    sql: ClientDashboardSqlResult,
  ): ClientDashboardResponse {
    return {
      clientId: sql.client_id,
      identification: sql.identification,
      clientName: sql.client_name,
      clientType: sql.client_type,

      infrastructure: {
        totalConnections: Number(sql.total_connections || 0),
        activeConnections: Number(sql.active_connections || 0),
        installedMeters: Number(sql.installed_meters || 0),
        withSewerService: Number(sql.with_sewer_service || 0),
      },

      consumption: {
        readingHistoryCount: Number(sql.reading_history_count || 0),
        averageConsumptionM3: Number(sql.average_consumption_m3 || 0),
        lastReadingDate: sql.last_reading_date || null,
        consumptionProfile: sql.consumption_profile,
      },

      processes: {
        totalRequests: Number(sql.total_requests || 0),
        pendingRequests: Number(sql.pending_requests || 0),
        totalWorkOrders: Number(sql.total_work_orders || 0),
        activeWorkOrders: Number(sql.active_work_orders || 0),
        totalIncidents: Number(sql.total_incidents || 0),
        pendingIncidents: Number(sql.pending_incidents || 0),
      },

      financials: {
        invoiceCount: Number(sql.invoice_count || 0),
        totalInvoicedAmount: Number(sql.total_invoiced_amount || 0),
        currentDebtAmount: Number(sql.current_debt_amount || 0),
        healthStatus: sql.financial_health_status,
      },

      clientSinceDate: sql.client_since_date,
    };
  }

  /**
   * Adapts raw SQL results from dashboard_acometidas.sql into structured Response DTOs
   */
  static toConnectionDashboardResponse(
    sql: ConnectionDashboardSqlResult,
  ): ConnectionDashboardResponse {
    // Manejo seguro del array (en caso de que pg driver no lo parsee o venga nulo)
    let history = sql.history_last_12_readings || [];
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch (e) {
        history = [];
      }
    }

    let incidents = sql.details_last_incidents || [];
    if (typeof incidents === 'string') {
      try {
        incidents = JSON.parse(incidents);
      } catch (e) {
        incidents = [];
      }
    }

    return {
      connectionId: sql.connection_id,
      cadastralKey: sql.cadastral_key,
      status: sql.connection_status,
      hasSewerService: sql.has_sewer_service === 'YES',
      latitude: sql.latitude ? Number(sql.latitude) : null,
      longitude: sql.longitude ? Number(sql.longitude) : null,

      client: {
        identification: sql.client_identification,
        name: sql.responsible_client,
        clientId: sql.client_id, // Assuming clientId is the same as identification
      },

      address: sql.address,

      meter: {
        serial: sql.physical_meter_serial,
        brand: sql.meter_brand,
        diameterMm: Number(sql.diameter_mm || 0),
      },

      consumption: {
        totalReadingsCount: Number(sql.total_readings_count || 0),
        lastConsumptionM3: Number(sql.last_consumption_m3 || 0),
        historicalAverageM3: Number(sql.historical_average_m3 || 0),
        lastReadingDate: sql.last_reading_date || null,
        history: history.map((reading: any) => ({
          date: reading.date,
          previousReading: Number(reading.previous_reading || 0),
          currentReading: Number(reading.current_reading || 0),
          consumptionM3: Number(reading.consumption_m3 || 0),
          anomalyNovelty: reading.anomaly_novelty || null,
        })),
        automaticAlert: sql.automatic_alert,
      },

      incidents: {
        totalCount: Number(sql.total_incidents_count || 0),
        pendingCount: Number(sql.pending_incidents_count || 0),
        latest: incidents.map((incident: any) => ({
          reportDate: incident.report_date,
          status: incident.status,
          description: incident.description,
          priority: incident.priority,
        })),
      },
    };
  }
}
