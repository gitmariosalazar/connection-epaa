export interface RequestResponse {
  requestId: string;
  clientId: string;
  personType: string;
  connectionType: string;
  propertyUse: string;
  address: string;
  cadastralKey: string;
  geom: string | null;
  status: string;
  additionalInfo: Record<string, any>;
  analysticId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
