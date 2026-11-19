import { StateHistoryOriginEnum } from '../../../domain/enums/state-history.enums';

export interface EvidenceFileInput {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
}

export interface ChangeConnectionStateRequest {
  connectionId: string;
  newStateId: number;
  userId: string;
  reason: string;
  origin?: StateHistoryOriginEnum;
  supportDocument?: string;
  evidenceFile?: EvidenceFileInput;
  observations?: string;
  ipAddress?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  effectiveDate?: string;
}
