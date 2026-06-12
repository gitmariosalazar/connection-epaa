import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_VALIDATION_MATRIX,
  NotificationValidationMatrixRowModel,
} from '../../../domain/schemas/models/notification-validation-matrix.model';
import {
  NotificationValidationMatrixResponse,
  NotificationValidationMatrixRowResponse,
} from '../../dto/response/notification-validation-matrix.response';

@Injectable()
export class GetNotificationValidationMatrixUseCase {
  execute(): NotificationValidationMatrixResponse {
    const rows: NotificationValidationMatrixRowResponse[] =
      NOTIFICATION_VALIDATION_MATRIX.map(
        (item: NotificationValidationMatrixRowModel) => ({
          phaseCode: item.phaseCode,
          phaseName: item.phaseName,
          workflowTransition: item.workflowTransition,
          kafkaEvent: item.kafkaEvent,
          destinationRole: item.destinationRole,
          destinationSource: item.destinationSource,
          producerService: item.producerService,
          consumerService: item.consumerService,
          channels: item.channels,
          implementedInNotifications: item.implementedInNotifications,
          qaCheck: item.qaCheck,
        }),
      );

    const coveredEvents = rows.filter(
      (row) => row.implementedInNotifications,
    ).length;

    return {
      generatedAt: new Date(),
      totalEvents: rows.length,
      coveredEvents,
      missingConsumers: rows.length - coveredEvents,
      rows,
    };
  }
}
