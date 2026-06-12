export interface NotificationValidationMatrixRowResponse {
  phaseCode: string;
  phaseName: string;
  workflowTransition: string;
  kafkaEvent: string;
  destinationRole: string;
  destinationSource: string;
  producerService: string;
  consumerService: string;
  channels: string;
  implementedInNotifications: boolean;
  qaCheck: string;
}

export interface NotificationValidationMatrixResponse {
  generatedAt: Date;
  totalEvents: number;
  coveredEvents: number;
  missingConsumers: number;
  rows: NotificationValidationMatrixRowResponse[];
}
