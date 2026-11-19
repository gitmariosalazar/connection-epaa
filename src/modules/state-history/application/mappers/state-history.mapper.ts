import { StateHistoryModel } from '../../domain/schemas/models/state-history.model';
import { StateCatalogModel } from '../../domain/schemas/models/state-catalog.model';
import { StateSummaryModel } from '../../domain/schemas/models/state-summary.model';
import { ConnectionByStateItemModel } from '../../domain/schemas/models/connection-by-state.model';
import { CurrentConnectionStateInfo } from '../../domain/contracts/state-history.interface.repository';
import { StateHistoryResponse } from '../dto/response/state-history.response';
import { StateCatalogResponse } from '../dto/response/state-catalog.response';
import { StateSummaryResponse } from '../dto/response/state-summary.response';
import { CurrentConnectionStateResponse } from '../dto/response/current-connection-state.response';
import { ConnectionByStateItemResponse } from '../dto/response/paginated-state-history.response';

export class StateHistoryMapper {
  public static toResponse(model: StateHistoryModel): StateHistoryResponse {
    return {
      historialId: model.historialId ?? 0,
      connectionId: model.connectionId,
      previousStateId: model.previousStateId,
      previousStateName: model.previousStateName ?? null,
      newStateId: model.newStateId,
      newStateName: model.newStateName ?? '',
      allowsBilling: model.allowsBilling ?? false,
      allowsReading: model.allowsReading ?? false,
      requiresInspection: model.requiresInspection ?? false,
      changeDate: model.changeDate.toISOString(),
      effectiveDate: model.effectiveDate.toISOString(),
      reason: model.reason,
      supportDocument: model.supportDocument,
      idDocumento:
        model.idDocumento ??
        (model.supportDocument &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          model.supportDocument,
        )
          ? model.supportDocument
          : null),
      observations: model.observations,
      userId: model.userId,
      userEmail: model.userEmail ?? null,
      userFullName: model.userFullName ?? null,
      origin: model.origin,
      ipAddress: model.ipAddress,
      deviceId: model.deviceId,
      latitude: model.location?.latitude ?? null,
      longitude: model.location?.longitude ?? null,
      isReversal: model.isReversal,
      originHistoryId: model.originHistoryId,
      createdAt: model.createdAt.toISOString(),
    };
  }

  public static toCatalogResponse(model: StateCatalogModel): StateCatalogResponse {
    return {
      stateId: model.stateId,
      name: model.name,
      description: model.description,
      allowsBilling: model.allowsBilling,
      requiresInspection: model.requiresInspection,
      allowsReading: model.allowsReading,
    };
  }

  public static toSummaryResponse(model: StateSummaryModel): StateSummaryResponse {
    return {
      stateId: model.stateId,
      stateName: model.stateName,
      description: model.description,
      totalConnections: model.totalConnections,
      percentage: model.percentage,
      allowsBilling: model.allowsBilling,
      allowsReading: model.allowsReading,
      requiresInspection: model.requiresInspection,
    };
  }

  public static toCurrentStateResponse(info: CurrentConnectionStateInfo): CurrentConnectionStateResponse {
    return {
      connectionId: info.connectionId,
      stateId: info.stateId,
      stateName: info.stateName,
      description: info.description,
      allowsBilling: info.allowsBilling,
      allowsReading: info.allowsReading,
      requiresInspection: info.requiresInspection,
      isActiveLegacy: info.isActiveLegacy,
      lastChangedAt: info.lastChangedAt ? info.lastChangedAt.toISOString() : null,
      lastReason: info.lastReason,
      lastOrigin: info.lastOrigin,
    };
  }

  public static toConnectionByStateResponse(model: ConnectionByStateItemModel): ConnectionByStateItemResponse {
    return {
      connectionId: model.connectionId,
      accountNumber: model.accountNumber,
      cadastralKey: model.cadastralKey,
      contractNumber: model.contractNumber,
      sectorId: model.sectorId,
      stateId: model.stateId,
      stateName: model.stateName,
      isActiveLegacy: model.isActiveLegacy,
      clientName: model.clientName,
      clientIdentification: model.clientIdentification,
      lastStateChangedAt: model.lastStateChangedAt ? model.lastStateChangedAt.toISOString() : null,
    };
  }
}
