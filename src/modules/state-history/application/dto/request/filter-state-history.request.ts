import { StateHistoryOriginEnum } from '../../../domain/enums/state-history.enums';

export interface FilterStateHistoryRequest {
  connectionId?: string;
  stateId?: number;
  userId?: string;
  origin?: StateHistoryOriginEnum;
  startDate?: string;
  endDate?: string;
  isReversal?: boolean;
  limit?: number;
  offset?: number;
}
