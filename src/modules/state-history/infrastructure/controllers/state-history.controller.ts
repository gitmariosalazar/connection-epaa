import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ChangeConnectionStateUseCase } from '../../application/usecases/ChangeConnectionStateUseCase';
import { BulkChangeConnectionStateUseCase } from '../../application/usecases/BulkChangeConnectionStateUseCase';
import { RevertStateHistoryUseCase } from '../../application/usecases/RevertStateHistoryUseCase';
import { GetConnectionHistoryUseCase } from '../../application/usecases/GetConnectionHistoryUseCase';
import { GetStateHistoryByIdUseCase } from '../../application/usecases/GetStateHistoryByIdUseCase';
import { GetCurrentConnectionStateUseCase } from '../../application/usecases/GetCurrentConnectionStateUseCase';
import { GetConnectionsByStateUseCase } from '../../application/usecases/GetConnectionsByStateUseCase';
import { GetStateCatalogUseCase } from '../../application/usecases/GetStateCatalogUseCase';
import { GetStateSummaryUseCase } from '../../application/usecases/GetStateSummaryUseCase';
import { FilterStateHistoryUseCase } from '../../application/usecases/FilterStateHistoryUseCase';
import { GetAllowedTransitionsUseCase } from '../../application/usecases/GetAllowedTransitionsUseCase';
import { GetReversibleHistoryUseCase } from '../../application/usecases/GetReversibleHistoryUseCase';
import {
  GetStateEventsGeoJSONUseCase,
  GetStateEventsGeoJSONFilter,
} from '../../application/usecases/GetStateEventsGeoJSONUseCase';
import { ConnectionStateChangedEventPayload } from '../../domain/contracts/state-history-event.publisher.interface';

import { ChangeConnectionStateRequest } from '../../application/dto/request/change-connection-state.request';
import { BulkChangeConnectionStateRequest } from '../../application/dto/request/bulk-change-connection-state.request';
import { RevertStateHistoryRequest } from '../../application/dto/request/revert-state-history.request';
import { FilterStateHistoryRequest } from '../../application/dto/request/filter-state-history.request';

import { StateHistoryResponse, BulkStateChangeResponse } from '../../application/dto/response/state-history.response';
import { StateCatalogResponse } from '../../application/dto/response/state-catalog.response';
import { StateSummaryResponse } from '../../application/dto/response/state-summary.response';
import { CurrentConnectionStateResponse } from '../../application/dto/response/current-connection-state.response';
import { AllowedTransitionsResponse } from '../../application/dto/response/allowed-transitions.response';
import { ReversibleRecordResponse } from '../../application/dto/response/reversible-record.response';
import { StateEventsGeoJSONResponse } from '../../application/dto/response/geo-events.response';
import {
  PaginatedStateHistoryResponse,
  PaginatedConnectionsByStateResponse,
} from '../../application/dto/response/paginated-state-history.response';

@Controller('state-history')
export class StateHistoryController {
  private readonly logger: Logger = new Logger(StateHistoryController.name);

  constructor(
    private readonly changeStateUseCase: ChangeConnectionStateUseCase,
    private readonly bulkChangeUseCase: BulkChangeConnectionStateUseCase,
    private readonly revertStateUseCase: RevertStateHistoryUseCase,
    private readonly getConnectionHistoryUseCase: GetConnectionHistoryUseCase,
    private readonly getHistoryByIdUseCase: GetStateHistoryByIdUseCase,
    private readonly getCurrentStateUseCase: GetCurrentConnectionStateUseCase,
    private readonly getConnectionsByStateUseCase: GetConnectionsByStateUseCase,
    private readonly getCatalogUseCase: GetStateCatalogUseCase,
    private readonly getSummaryUseCase: GetStateSummaryUseCase,
    private readonly filterHistoryUseCase: FilterStateHistoryUseCase,
    private readonly getAllowedTransitionsUseCase: GetAllowedTransitionsUseCase,
    private readonly getReversibleHistoryUseCase: GetReversibleHistoryUseCase,
    private readonly getStateEventsGeoJSONUseCase: GetStateEventsGeoJSONUseCase,
  ) {}

  @MessagePattern('state_history.change')
  async changeConnectionState(
    @Payload() payload: ChangeConnectionStateRequest,
  ): Promise<StateHistoryResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.change' | Connection: ${payload.connectionId} -> Target State: ${payload.newStateId} | User: ${payload.userId} | Origin: ${payload.origin}`,
    );
    const result = await this.changeStateUseCase.execute(payload);
    this.logger.log(
      `📤 [CONNECTION-SERVICE -> KAFKA-RPC] Pattern: 'state_history.change' completed | Connection: ${result.connectionId} is now ${result.newStateName} (ID: ${result.newStateId}) | Ledger ID: ${result.historialId}`,
    );
    return result;
  }

  @MessagePattern('state_history.bulk_change')
  async bulkChangeConnectionState(
    @Payload() payload: BulkChangeConnectionStateRequest,
  ): Promise<BulkStateChangeResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.bulk_change' | Connections: ${payload.connectionIds?.length} | Target State: ${payload.newStateId} | User: ${payload.userId}`,
    );
    const result = await this.bulkChangeUseCase.execute(payload);
    this.logger.log(
      `📤 [CONNECTION-SERVICE -> KAFKA-RPC] Pattern: 'state_history.bulk_change' completed | Updated: ${result.totalUpdated}/${result.totalRequested} connections to ${result.newStateName}`,
    );
    return result;
  }

  @MessagePattern('state_history.revert')
  async revertStateHistory(
    @Payload() payload: RevertStateHistoryRequest,
  ): Promise<StateHistoryResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.revert' | Target Historial ID: ${payload.historialId} | User: ${payload.userId} | Reason: ${payload.reason}`,
    );
    const result = await this.revertStateUseCase.execute(payload);
    this.logger.log(
      `📤 [CONNECTION-SERVICE -> KAFKA-RPC] Pattern: 'state_history.revert' completed | Connection: ${result.connectionId} reverted to ${result.newStateName} (ID: ${result.newStateId}) | Reversal ID: ${result.historialId}`,
    );
    return result;
  }

  @MessagePattern('state_history.get_by_connection')
  async getConnectionHistory(
    @Payload() payload: { connectionId: string; limit?: number; offset?: number },
  ): Promise<PaginatedStateHistoryResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_by_connection' | Connection: ${payload.connectionId} | Limit: ${payload.limit ?? 50} | Offset: ${payload.offset ?? 0}`,
    );
    return await this.getConnectionHistoryUseCase.execute(
      payload.connectionId,
      payload.limit,
      payload.offset,
    );
  }

  @MessagePattern('state_history.get_by_id')
  async getStateHistoryById(
    @Payload() payload: { historialId: number } | number,
  ): Promise<StateHistoryResponse> {
    const id = typeof payload === 'number' ? payload : payload.historialId;
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_by_id' | Historial ID: ${id}`,
    );
    return await this.getHistoryByIdUseCase.execute(id);
  }

  @MessagePattern('state_history.get_current_state')
  async getCurrentConnectionState(
    @Payload() payload: { connectionId: string } | string,
  ): Promise<CurrentConnectionStateResponse> {
    const connectionId = typeof payload === 'string' ? payload : payload.connectionId;
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_current_state' | Connection: ${connectionId}`,
    );
    return await this.getCurrentStateUseCase.execute(connectionId);
  }

  @MessagePattern('state_history.get_connections_by_state')
  async getConnectionsByState(
    @Payload() payload: { stateId: number; sectorId?: number; limit?: number; offset?: number },
  ): Promise<PaginatedConnectionsByStateResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_connections_by_state' | State ID: ${payload.stateId} | Sector: ${payload.sectorId ?? 'ALL'} | Limit: ${payload.limit ?? 50}`,
    );
    return await this.getConnectionsByStateUseCase.execute(
      payload.stateId,
      payload.sectorId,
      payload.limit,
      payload.offset,
    );
  }

  @MessagePattern('state_history.get_catalog')
  async getStateCatalog(): Promise<StateCatalogResponse[]> {
    this.logger.log(`📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_catalog'`);
    return await this.getCatalogUseCase.getAll();
  }

  @MessagePattern('state_history.get_catalog_by_id')
  async getStateCatalogById(
    @Payload() payload: { stateId: number } | number,
  ): Promise<StateCatalogResponse> {
    const id = typeof payload === 'number' ? payload : payload.stateId;
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_catalog_by_id' | State ID: ${id}`,
    );
    return await this.getCatalogUseCase.getById(id);
  }

  @MessagePattern('state_history.get_summary')
  async getStateSummary(): Promise<StateSummaryResponse[]> {
    this.logger.log(`📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_summary'`);
    return await this.getSummaryUseCase.execute();
  }

  @MessagePattern('state_history.filter')
  async filterStateHistory(
    @Payload() payload: FilterStateHistoryRequest,
  ): Promise<PaginatedStateHistoryResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.filter' | Connection: ${payload.connectionId ?? 'ALL'} | State: ${payload.stateId ?? 'ALL'} | User: ${payload.userId ?? 'ALL'}`,
    );
    return await this.filterHistoryUseCase.execute(payload);
  }

  @MessagePattern('state_history.get_allowed_transitions')
  async getAllowedTransitions(
    @Payload() payload: { connectionId: string } | string,
  ): Promise<AllowedTransitionsResponse> {
    const connectionId = typeof payload === 'string' ? payload : payload.connectionId;
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_allowed_transitions' | Connection: ${connectionId}`,
    );
    return await this.getAllowedTransitionsUseCase.execute(connectionId);
  }

  @MessagePattern('state_history.get_reversible')
  async getReversibleHistory(
    @Payload() payload: { connectionId: string } | string,
  ): Promise<ReversibleRecordResponse> {
    const connectionId = typeof payload === 'string' ? payload : payload.connectionId;
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_reversible' | Connection: ${connectionId}`,
    );
    return await this.getReversibleHistoryUseCase.execute(connectionId);
  }

  @MessagePattern('state_history.get_geo_events')
  async getStateEventsGeoJSON(
    @Payload() payload: GetStateEventsGeoJSONFilter,
  ): Promise<StateEventsGeoJSONResponse> {
    this.logger.log(
      `📥 [CONNECTION-SERVICE <- KAFKA] Pattern: 'state_history.get_geo_events' | State: ${payload?.stateId ?? 'ALL'} | Sector: ${payload?.sectorId ?? 'ALL'}`,
    );
    return await this.getStateEventsGeoJSONUseCase.execute(payload || {});
  }

  // ── Kafka Domain Event Consumer ───────────────────────────────────────────
  @EventPattern('connection.state-changed')
  async handleConnectionStateChangedEvent(
    @Payload() payload: ConnectionStateChangedEventPayload,
  ): Promise<void> {
    this.logger.log(
      `🎯 [KAFKA-CONSUMER: StateChangedEventListener] Received Domain Event 'connection.state-changed' on Kafka bus! ` +
        `Event ID: ${payload.eventId} | Connection: ${payload.data.connectionId} transitioned to ${payload.data.newState.name} (ID: ${payload.data.newState.id}) ` +
        `| User: ${payload.data.userId} | Origin: ${payload.data.origin} | Ledger ID: ${payload.data.historialId} | Reversal: ${payload.data.isReversal}`,
    );
  }
}
