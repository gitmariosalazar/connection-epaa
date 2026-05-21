export interface ConnectionDocumentSQLResult {
  document_id: string;
  request_id: string;
  document_type_id: number;
  file_url: string;
  original_name: string;
  mime_type: string;
  size_in_bytes: number;
  hash_sha256: string;
  validation_status: string;
  observation: string;
  validator_id: string | null;
  validation_date: Date;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
