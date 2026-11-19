import { ConnectionStateEnum } from '../enums/state-history.enums';

export class ConnectionSuspensionPolicy {
  // IDs de catálogo: 3 = SUSPENDIDA VOLUNTARIA, 4 = CORTADA POR MORA, 13 = SUSPENDIDA GENERAL
  private static readonly SUSPENSION_STATE_IDS = new Set<number>([
    ConnectionStateEnum.VOLUNTARY_SUSPENDED,
    ConnectionStateEnum.CUT_FOR_ARREARS,
    ConnectionStateEnum.SUSPENDED_GENERAL,
    ConnectionStateEnum.INACTIVE,
    ConnectionStateEnum.REMOVED,
    ConnectionStateEnum.CLOSED,
  ]);

  /**
   * Determina si el nuevo estado representa un cese o corte de servicio.
   */
  public static isSuspensionState(stateId: number): boolean {
    return this.SUSPENSION_STATE_IDS.has(stateId);
  }
}
