import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { IStateHistoryEventPublisher } from '../../domain/contracts/state-history-event.publisher.interface';
import { RevertStateHistoryRequest } from '../dto/request/revert-state-history.request';
import { StateHistoryResponse } from '../dto/response/state-history.response';
import { StateHistoryModel } from '../../domain/schemas/models/state-history.model';
import { StateHistoryOriginEnum } from '../../domain/enums/state-history.enums';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';
import { randomUUID } from 'crypto';

@Injectable()
export class RevertStateHistoryUseCase {
  private readonly logger: Logger = new Logger(RevertStateHistoryUseCase.name);

  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
    @Inject('IStateHistoryEventPublisher')
    private readonly eventPublisher: IStateHistoryEventPublisher,
  ) {}

  async execute(request: RevertStateHistoryRequest): Promise<StateHistoryResponse> {
    this.logger.log(
      `⚙️ [USECASE: RevertStateHistory] Processing state reversal request for Historial ID #${request.historialId} (requested by User: ${request.userId})`,
    );
    if (!request.historialId || request.historialId < 1) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Valid historialId to revert is required',
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
        message: 'A justified reason is required to revert a state transition',
      });
    }

    const originalRecord = await this.repository.findById(request.historialId);
    if (!originalRecord) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `History entry with ID ${request.historialId} not found`,
      });
    }

    if (originalRecord.isReversal) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: `History entry ${request.historialId} is already a reversal record and cannot be reverted again`,
      });
    }

    const alreadyReverted = await this.repository.verifyReversalExists(request.historialId);
    if (alreadyReverted) {
      throw new RpcException({
        statusCode: statusCode.CONFLICT,
        message: `History entry ${request.historialId} has already been reverted previously`,
      });
    }

    if (originalRecord.previousStateId === null) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: `Cannot revert initial registration baseline (entry ${request.historialId} has no previous state)`,
      });
    }

    const currentState = await this.repository.findCurrentStateByConnectionId(originalRecord.connectionId);
    if (!currentState) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `Connection ${originalRecord.connectionId} no longer exists`,
      });
    }

    if (currentState.stateId !== originalRecord.newStateId) {
      throw new RpcException({
        statusCode: statusCode.CONFLICT,
        message: `Cannot revert entry ${request.historialId}: Connection ${originalRecord.connectionId} has progressed to state ${currentState.stateName} (ID: ${currentState.stateId}) and is no longer in state ${originalRecord.newStateId}`,
      });
    }

    const hasCoordinates =
      typeof request.latitude === 'number' && typeof request.longitude === 'number';

    const origin = request.origin ?? StateHistoryOriginEnum.WEB;
    const now = new Date();

    const reversalEntry = new StateHistoryModel(
      null,
      originalRecord.connectionId,
      currentState.stateId,
      originalRecord.previousStateId,
      now,
      now,
      request.reason.trim(),
      request.supportDocument?.trim() ?? originalRecord.supportDocument,
      request.observations?.trim() ?? `Reversal of transition recorded in history ID #${request.historialId}`,
      request.userId.trim(),
      origin,
      request.ipAddress?.trim() ?? null,
      request.deviceId?.trim() ?? null,
      hasCoordinates ? { latitude: request.latitude!, longitude: request.longitude! } : null,
      true,
      request.historialId,
      now,
    );

    const revertedRecord = await this.repository.revertStateHistory(request.historialId, reversalEntry);
    const response = StateHistoryMapper.toResponse(revertedRecord);

    this.logger.log(
      `💾 [USECASE: RevertStateHistory] Reversal persisted: New Historial ID #${response.historialId} created (es_reverso=true, reverso_de_id=${request.historialId}). Connection ${response.connectionId} restored to state ${response.newStateName} (ID: ${response.newStateId})`,
    );

    // Publish domain event to Kafka (Section 9.1 of specification)
    this.eventPublisher.publishStateChangedEvent({
      eventId: randomUUID(),
      eventType: 'CONNECTION_STATE_CHANGED',
      timestamp: new Date().toISOString(),
      data: {
        historialId: response.historialId,
        connectionId: response.connectionId,
        previousState: response.previousStateId !== null
          ? {
              id: response.previousStateId,
              name: response.previousStateName ?? '',
              allowsBilling: false,
              allowsReading: false,
              requiresInspection: false,
            }
          : null,
        newState: {
          id: response.newStateId,
          name: response.newStateName,
          allowsBilling: response.allowsBilling,
          allowsReading: response.allowsReading,
          requiresInspection: response.requiresInspection,
        },
        effectiveDate: response.effectiveDate,
        userId: response.userId,
        origin: response.origin,
        location:
          response.latitude !== null && response.longitude !== null
            ? { latitude: response.latitude, longitude: response.longitude }
            : null,
        isReversal: response.isReversal,
      },
    });

    return response;
  }
}
