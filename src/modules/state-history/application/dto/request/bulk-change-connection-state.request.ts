import { StateHistoryOriginEnum } from '../../../domain/enums/state-history.enums';

export interface BulkChangeConnectionStateRequest {
  connectionIds: string[];
  newStateId: number;
  userId: string;
  reason: string;
  origin?: StateHistoryOriginEnum;
  supportDocument?: string;
  observations?: string;
}
