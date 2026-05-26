import { ServerKafka, CustomTransportStrategy } from '@nestjs/microservices';
import { EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';

export class CustomServerKafka
  extends ServerKafka
  implements CustomTransportStrategy
{
  protected readonly logger = new Logger('CustomServerKafka');
  private readonly mainTopic: string;

  constructor(options: any, mainTopic: string) {
    super(options);
    this.mainTopic = mainTopic;
  }

  public async listen(callback: (err?: unknown, ...args: unknown[]) => void) {
    const originalBindEvents = this.bindEvents.bind(this);
    this.bindEvents = async (consumer: any) => {
      await consumer.subscribe({
        topics: [this.mainTopic],
        fromBeginning: false,
      });
      await originalBindEvents(consumer);
    };
    return super.listen(callback);
  }

  public async handleMessage(payload: EachMessagePayload) {
    const { message, topic } = payload;
    let pattern: string = '';

    try {
      const valueStr = message.value ? message.value.toString() : null;

      if (valueStr && valueStr.startsWith('{')) {
        const parsed = JSON.parse(valueStr);

        if (parsed && parsed.pattern) {
          const nestedData =
            parsed.data && typeof parsed.data === 'object' ? parsed.data : null;
          const contextualData =
            nestedData &&
            nestedData.value &&
            typeof nestedData.value === 'object'
              ? nestedData.value
              : null;

          const innerPattern =
            nestedData?.pattern || contextualData?.pattern || '';
          const innerPayload =
            nestedData?.data !== undefined
              ? nestedData.data
              : contextualData?.data !== undefined
                ? contextualData.data
                : contextualData || nestedData;

          // Caso 1: request-response con correlation id.
          // Soporta ambos formatos:
          // - { id, pattern:'topic', data:{ pattern:'real.handler', data:{...} } }
          // - { id, pattern:'topic', data:{ value:{ pattern:'real.handler', data:{...} }, headers:{...} } }
          if (parsed.id && innerPattern) {
            pattern = innerPattern;
            payload.message.value = Buffer.from(
              JSON.stringify({
                id: parsed.id,
                pattern: innerPattern,
                data: innerPayload,
              }),
            );
          }
          // Caso 2: mensaje directo con pattern/data
          else {
            pattern = parsed.pattern;
            const finalData = parsed.data;
            if (finalData !== null && finalData !== undefined) {
              const bufferData =
                typeof finalData === 'string'
                  ? finalData
                  : JSON.stringify(finalData);
              payload.message.value = Buffer.from(bufferData);
            }
          }
        }
      }
    } catch (e) {
      this.logger.error(`[ParseError] ${e}`);
    }

    if (!pattern) {
      const key = message.key ? message.key.toString() : '';
      pattern = key && key !== topic ? key : topic;
    }

    this.logger.log(`[Routing] Topic: ${topic}, Pattern: ${pattern}`);

    return super.handleMessage({ ...payload, topic: pattern });
  }
}
