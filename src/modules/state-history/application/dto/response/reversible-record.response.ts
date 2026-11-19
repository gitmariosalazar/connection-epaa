import { StateHistoryResponse } from './state-history.response';

export interface ReversibleRecordResponse {
  connectionId: string;
  isReversible: boolean;
  message: string;
  record: StateHistoryResponse | null;
}
