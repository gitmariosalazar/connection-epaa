export interface PhotoConnectionSQLResponse {
  photoConnectionId?: number;
  connectionId: string;
  photoUrl: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}