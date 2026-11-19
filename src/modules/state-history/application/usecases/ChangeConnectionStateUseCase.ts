import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { IStateHistoryEventPublisher } from '../../domain/contracts/state-history-event.publisher.interface';
import { StateTransitionMatrixService } from '../../domain/services/state-transition-matrix.service';
import { ChangeConnectionStateRequest } from '../dto/request/change-connection-state.request';
import { StateHistoryResponse } from '../dto/response/state-history.response';
import { StateHistoryModel } from '../../domain/schemas/models/state-history.model';
import { StateHistoryOriginEnum } from '../../domain/enums/state-history.enums';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';
import { randomUUID } from 'crypto';
import { IConnectionSuspendedEventPublisher } from '../../domain/contracts/connection-suspended-event.publisher.interface';
import { ConnectionSuspensionPolicy } from '../../domain/services/connection-suspension.policy';
import { IDocumentService } from '../../domain/contracts/document-service.interface';

@Injectable()
export class ChangeConnectionStateUseCase {
  private readonly logger: Logger = new Logger(
    ChangeConnectionStateUseCase.name,
  );

  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
    @Inject('IStateHistoryEventPublisher')
    private readonly eventPublisher: IStateHistoryEventPublisher,
    @Inject('IDocumentService')
    private readonly documentService: IDocumentService, // <-- Puerto de documentos
    @Inject('IConnectionSuspendedEventPublisher')
    private readonly suspendedEventPublisher: IConnectionSuspendedEventPublisher,
  ) {}

  async execute(
    request: ChangeConnectionStateRequest,
  ): Promise<StateHistoryResponse> {
    this.logger.log(
      `⚙️ [USECASE: ChangeConnectionState] Processing state change request | Connection: ${request.connectionId} -> Target State: ${request.newStateId} | User: ${request.userId} | Origin: ${request.origin ?? 'WEB'}`,
    );

    if (!request.connectionId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'connectionId is required',
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

    const connectionExists = await this.repository.verifyConnectionExists(
      request.connectionId,
    );
    if (!connectionExists) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `Connection ${request.connectionId} does not exist`,
      });
    }

    const stateExists = await this.repository.verifyStateExists(
      request.newStateId,
    );
    if (!stateExists) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `State ID ${request.newStateId} does not exist in catalog`,
      });
    }

    const currentState = await this.repository.findCurrentStateByConnectionId(
      request.connectionId,
    );

    if (currentState && currentState.stateId === request.newStateId) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: `Connection ${request.connectionId} is already in state ${currentState.stateName} (ID: ${request.newStateId})`,
      });
    }

    // Validate against the official 15x15 transition matrix (Section 5.1)
    const transitionCheck = StateTransitionMatrixService.validateTransition(
      currentState ? currentState.stateId : null,
      request.newStateId,
    );
    if (!transitionCheck.isValid) {
      this.logger.warn(
        `⛔ [USECASE: ChangeConnectionState] Transition matrix rejected: ${transitionCheck.message}`,
      );
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: transitionCheck.message,
      });
    }

    this.logger.log(
      `✅ [USECASE: ChangeConnectionState] Matrix check approved: ${currentState ? currentState.stateName : 'INITIAL'} (${currentState?.stateId ?? 'NULL'}) -> State ID ${request.newStateId}`,
    );

    let documentoRespaldoId: string | null =
      request.supportDocument?.trim() ?? null;

    if (request.evidenceFile && request.evidenceFile.buffer) {
      this.logger.log(
        `📄 [USECASE: ChangeConnectionState] Uploading evidence file "${request.evidenceFile.originalName}" to documents microservice for connection ${request.connectionId}`,
      );
      const uploadResult = await this.documentService.uploadEvidence({
        fileName: request.evidenceFile.originalName,
        buffer: request.evidenceFile.buffer,
        mimeType: request.evidenceFile.mimeType,
        connectionId: request.connectionId,
        userId: request.userId,
        tipoDocumento: ConnectionSuspensionPolicy.isSuspensionState(request.newStateId)
          ? 'EVIDENCIA_SUSPENSION'
          : 'EVIDENCIA_CAMBIO_ESTADO',
        observaciones: request.reason,
      });

      documentoRespaldoId = uploadResult.documentId;
    }

    const effectiveDate = request.effectiveDate
      ? new Date(request.effectiveDate)
      : new Date();
    const hasCoordinates =
      typeof request.latitude === 'number' &&
      typeof request.longitude === 'number';

    const origin = request.origin ?? StateHistoryOriginEnum.WEB;

    const modelToPersist = new StateHistoryModel(
      null,
      request.connectionId.trim(),
      currentState ? currentState.stateId : null,
      request.newStateId,
      new Date(),
      effectiveDate,
      request.reason.trim(),
      documentoRespaldoId,
      request.observations?.trim() ?? null,
      request.userId.trim(),
      origin,
      request.ipAddress?.trim() ?? null,
      request.deviceId?.trim() ?? null,
      hasCoordinates
        ? { latitude: request.latitude!, longitude: request.longitude! }
        : null,
      false,
      null,
      new Date(),
    );

    const createdRecord =
      await this.repository.createStateHistory(modelToPersist);
    const response = StateHistoryMapper.toResponse(createdRecord);

    this.logger.log(
      `💾 [USECASE: ChangeConnectionState] State transition ledger entry created: Historial ID #${response.historialId} for connection ${response.connectionId}. Synchronized public.acometida (estado_actual_id=${response.newStateId}, estado=${response.allowsBilling})`,
    );

    // Publish domain event to Kafka (Section 9.1 of specification)
    this.eventPublisher.publishStateChangedEvent({
      eventId: randomUUID(),
      eventType: 'CONNECTION_STATE_CHANGED',
      timestamp: new Date().toISOString(),
      data: {
        historialId: response.historialId,
        connectionId: response.connectionId,
        previousState:
          response.previousStateId !== null
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

    if (ConnectionSuspensionPolicy.isSuspensionState(response.newStateId)) {
      const cadastral =
        await this.repository.findCadastralDetailsByConnectionId(
          response.connectionId,
        );

      if (cadastral && cadastral.sector && cadastral.account) {
        await this.suspendedEventPublisher.publishSuspendedEvent({
          eventId: randomUUID(),
          eventType: 'CONNECTION_SUSPENDED',
          timestamp: new Date().toISOString(),
          data: {
            connectionId: response.connectionId,
            sector: Number(cadastral.sector),
            account: Number(cadastral.account),
            cadastralKey:
              cadastral.cadastralKey ||
              `${cadastral.sector}-${cadastral.account}`,
            stateId: response.newStateId,
            stateName: response.newStateName,
            reason: response.reason || 'Suspensión de acometida',
            userId: response.userId,
            effectiveDate: response.effectiveDate,
            state: 'SUSPENDIDO',
          },
        });
      } else {
        this.logger.warn(
          `⚠️ Acometida ${response.connectionId} no tiene sector/cuenta asignados; no se emitió evento a legacy.`,
        );
      }
    }

    return response;
  }
}
