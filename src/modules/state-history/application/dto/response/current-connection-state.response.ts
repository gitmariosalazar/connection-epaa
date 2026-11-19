export interface CurrentConnectionStateResponse {
  connectionId: string;
  stateId: number;
  stateName: string;
  description: string;
  allowsBilling: boolean;
  allowsReading: boolean;
  requiresInspection: boolean;
  isActiveLegacy: boolean;
  lastChangedAt: string | null;
  lastReason: string | null;
  lastOrigin: string | null;
}
