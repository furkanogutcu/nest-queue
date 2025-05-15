import { BullBoardOptions } from './queue-module-options.interface';

export interface QueueServiceOptions {
  redisKeyPrefix?: string;
  bullBoard?: BullBoardOptions;
}
