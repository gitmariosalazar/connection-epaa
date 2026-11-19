import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { BulkChangeConnectionStateRequest } from '../dto/request/bulk-change-connection-state.request';
import { BulkStateChangeResponse } from '../dto/response/state-history.response';
import { StateHistoryModel } from '../../domain/schemas/models/state-history.model';
import { StateHistoryOriginEnum } from '../../domain/enums/state-history.enums';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class BulkChangeConnectionStateUseCase {
  private readonly logger: Logger = new Logger(BulkChangeConnectionStateUseCase.name);

  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(request: BulkChangeConnectionStateRequest): Promise<BulkStateChangeResponse> {
    this.logger.log(
      `⚙️ [USECASE: BulkChangeConnectionState] Processing bulk state transition for ${request.connectionIds?.length ?? 0} connections -> Target State: ${request.newStateId} (User: ${request.userId})`,
    );
    if (!request.connectionIds || request.connectionIds.length === 0) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'At least one connectionId is required',
      });
    }

    if (!request.newStateId || request.newStateId < 1) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Valid newStateId is required',
      });
    }

    if (!request.userId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'userId is required',
      });
    }

    if (!request.reason?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'reason is mandatory for audit logging',
      });
    }

    const stateCatalog = await this.repository.getStateCatalogById(request.newStateId);
    if (!stateCatalog) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `State ID ${request.newStateId} does not exist in catalog`,
      });
    }

    // Sort IDs alphabetically to prevent PostgreSQL deadlocks across concurrent bulk operations
    const uniqueSortedConnectionIds = Array.from(new Set(request.connectionIds.map((id) => id.trim()))).sort();

    const origin = request.origin ?? StateHistoryOriginEnum.SYSTEM;
    const now = new Date();

    const entriesToCreate: StateHistoryModel[] = [];
    const failedConnectionIds: Array<{ connectionId: string; errorMessage: string }> = [];

    for (const connectionId of uniqueSortedConnectionIds) {
      const exists = await this.repository.verifyConnectionExists(connectionId);
      if (!exists) {
        failedConnectionIds.push({
          connectionId,
          errorMessage: 'Connection not found in database',
        });
        continue;
      }

      const currentState = await this.repository.findCurrentStateByConnectionId(connectionId);
      if (currentState && currentState.stateId === request.newStateId) {
        failedConnectionIds.push({
          connectionId,
          errorMessage: `Connection is already in state ${currentState.stateName} (${request.newStateId})`,
        });
        continue;
      }

      entriesToCreate.push(
        new StateHistoryModel(
          null,
          connectionId,
          currentState ? currentState.stateId : null,
          request.newStateId,
          now,
          now,
          request.reason.trim(),
          request.supportDocument?.trim() ?? null,
          request.observations?.trim() ?? null,
          request.userId.trim(),
          origin,
          null,
          null,
          null,
          false,
          null,
          now,
        ),
      );
    }

    const createdRecords = await this.repository.bulkCreateStateHistory(entriesToCreate);
    const updatedConnectionIds = createdRecords.map((r) => r.connectionId);

    this.logger.log(
      `💾 [USECASE: BulkChangeConnectionState] Bulk transition committed: ${updatedConnectionIds.length}/${uniqueSortedConnectionIds.length} connections updated to ${stateCatalog.name} (ID: ${request.newStateId}). Failed: ${failedConnectionIds.length}`,
    );

    return {
      totalRequested: uniqueSortedConnectionIds.length,
      totalUpdated: updatedConnectionIds.length,
      newStateId: request.newStateId,
      newStateName: stateCatalog.name,
      updatedConnectionIds,
      failedConnectionIds,
    };
  }
}
