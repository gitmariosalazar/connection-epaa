import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { StateTransitionMatrixService } from '../../domain/services/state-transition-matrix.service';
import { AllowedTransitionsResponse } from '../dto/response/allowed-transitions.response';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetAllowedTransitionsUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(connectionId: string): Promise<AllowedTransitionsResponse> {
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

    const currentState = await this.repository.findCurrentStateByConnectionId(connectionId.trim());
    const currentStateId = currentState ? currentState.stateId : null;
    const currentStateName = currentState ? currentState.stateName : 'SIN_ESTADO';

    const allowedTargets = StateTransitionMatrixService.getAllowedTargetStates(currentStateId);

    return {
      connectionId: connectionId.trim(),
      currentStateId,
      currentStateName,
      allowedTransitions: allowedTargets.map((t) => ({
        targetStateId: t.targetStateId,
        targetStateName: t.targetStateName,
        status: t.status,
        note: t.note,
      })),
    };
  }
}
