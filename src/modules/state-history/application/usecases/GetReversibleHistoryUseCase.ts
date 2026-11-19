import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { ReversibleRecordResponse } from '../dto/response/reversible-record.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetReversibleHistoryUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(connectionId: string): Promise<ReversibleRecordResponse> {
    if (!connectionId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'connectionId is required',
      });
    }

    const connectionExists = await this.repository.verifyConnectionExists(connectionId.trim());
    if (!connectionExists) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `Connection ${connectionId} does not exist`,
      });
    }

    const candidateRecord = await this.repository.findLatestReversibleByConnectionId(connectionId.trim());
    if (!candidateRecord) {
      return {
        connectionId: connectionId.trim(),
        isReversible: false,
        message: 'No reversible state history transition found for this connection.',
        record: null,
      };
    }

    // Verify it has a previous state to return to
    if (candidateRecord.previousStateId === null) {
      return {
        connectionId: connectionId.trim(),
        isReversible: false,
        message: 'The latest transition is the initial registration baseline and cannot be reversed.',
        record: null,
      };
    }

    // Verify that the connection is still in the state produced by this candidate record
    const currentState = await this.repository.findCurrentStateByConnectionId(connectionId.trim());
    if (!currentState || currentState.stateId !== candidateRecord.newStateId) {
      return {
        connectionId: connectionId.trim(),
        isReversible: false,
        message: `Cannot revert entry #${candidateRecord.historialId}: connection has progressed to state ${currentState?.stateName} (ID: ${currentState?.stateId}) and is no longer in state ${candidateRecord.newStateId}.`,
        record: null,
      };
    }

    return {
      connectionId: connectionId.trim(),
      isReversible: true,
      message: 'Active state transition is eligible for reversal.',
      record: StateHistoryMapper.toResponse(candidateRecord),
    };
  }
}
