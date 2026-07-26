import {
  SqlViewInstallationReport,
  SqlViewWorkOrderDetail,
  SqlViewRequestDetail,
  GeoJsonPoint,
} from '../interfaces/sql/sql-result';

import {
  InstallationReportResponse,
  WorkOrderDetailResponse,
  RequestDetailResponse,
  GeoPointResponse,
} from '../../domain/schemas/dto/response/installation-response';

export class WorkOrderInstallationViewAdapter {
  private static mapGeoJsonToPoint(
    geom: GeoJsonPoint | null,
  ): GeoPointResponse | null {
    if (!geom || !geom.coordinates || geom.coordinates.length < 2) return null;
    return {
      longitude: geom.coordinates[0],
      latitude: geom.coordinates[1], // Note: GeoJSON is [longitude, latitude]
    };
  }

  private static mapRequestDetail(
    raw: SqlViewRequestDetail,
  ): RequestDetailResponse {
    return {
      id: raw.request_id,
      requestNumber: raw.request_number,
      connectionType: raw.connection_type,
      propertyUse: raw.property_use,
      address: raw.address,
      status: raw.status,
      cadastralCode: raw.cadastral_code,
      client: raw.client
        ? {
            type: raw.client.type,
            identification: raw.client.identification,
            fullName: raw.client.full_name,
          }
        : null,
      analyst: raw.analyst
        ? {
            id: raw.analyst.analyst_id,
            fullName:
              `${raw.analyst.first_name} ${raw.analyst.last_name}`.trim(),
          }
        : null,
      documents: raw.documents.map((doc) => ({
        id: doc.document_id,
        fileUrl: doc.file_url,
        originalName: doc.original_name,
        validationStatus: doc.validation_status,
      })),
    };
  }

  private static mapWorkOrderDetail(
    raw: SqlViewWorkOrderDetail,
  ): WorkOrderDetailResponse {
    return {
      id: raw.work_order_id,
      orderCode: raw.order_code,
      status: raw.status,
      origin: raw.origin,
      priorityId: raw.priority_id,
      assignmentDate: raw.assignment_date,
      completedDate: raw.completed_date,
      workers: raw.workers.map((w) => ({
        assignmentId: w.assignment_id,
        workerId: w.worker_id,
        isResponsible: w.is_responsible,
        assignmentDate: w.assignment_date,
        fullName: `${w.first_name} ${w.last_name}`.trim(),
        email: w.email,
        phone: w.phone,
        roleId: w.role_id,
      })),
      materials: raw.materials.map((m) => ({
        id: m.material_id,
        code: m.code,
        name: m.name,
        quantity: m.quantity,
        unitCost: m.unit_cost,
        subtotal: m.subtotal,
      })),
      evidenceAttachments: raw.attachments.map((a) => ({
        id: a.attachment_id,
        type: a.type,
        fileUrl: a.file_url,
        createdAt: a.created_at,
      })),
      observations: raw.observations.map((o) => ({
        id: o.observation_id,
        text: o.text,
        createdAt: o.created_at,
      })),
    };
  }

  public static mapInstallationViewToResponse(
    raw: SqlViewInstallationReport,
  ): InstallationReportResponse {
    return {
      id: raw.report_id,
      result: raw.result,
      installationDate: raw.installation_date,
      meterNumber: raw.meter_number,
      initialReading: raw.initial_reading,
      securitySeal: raw.security_seal,
      connectionDiameter: raw.connection_diameter,
      location: WorkOrderInstallationViewAdapter.mapGeoJsonToPoint(
        raw.location,
      ),
      finalConditions: raw.final_conditions,
      observations: raw.observations,
      clientSignatureUrl: raw.client_signature_url,
      isApproved: raw.is_approved,
      approvalDate: raw.approval_date,
      createdAt: raw.created_at,

      approver: raw.approver_detail
        ? {
            id: raw.approver_detail.approver_id,
            fullName:
              `${raw.approver_detail.first_name} ${raw.approver_detail.last_name}`.trim(),
            email: raw.approver_detail.email,
            roleId: raw.approver_detail.role_id,
          }
        : null,

      request: WorkOrderInstallationViewAdapter.mapRequestDetail(
        raw.request_detail,
      ),
      workOrder: WorkOrderInstallationViewAdapter.mapWorkOrderDetail(
        raw.work_order_detail,
      ),
    };
  }
}
