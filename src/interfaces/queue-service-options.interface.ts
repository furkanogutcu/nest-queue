import { BullBoardOptions, ConfigOptions, QueueConfig } from './queue-module-options.interface';

export interface QueueServiceOptions {
  config?: ConfigOptions;
  bullBoard?: BullBoardOptions;
  queuesConfig?: QueueConfig[];
}
