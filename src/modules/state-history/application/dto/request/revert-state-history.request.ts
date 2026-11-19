import { StateHistoryOriginEnum } from '../../../domain/enums/state-history.enums';

export interface RevertStateHistoryRequest {
  historialId: number;
  userId: string;
  reason: string;
  supportDocument?: string;
  observations?: string;
  origin?: StateHistoryOriginEnum;
  ipAddress?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
}
