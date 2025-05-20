import { BoardOptions } from '@bull-board/api/dist/typings/app';
import { RedisConnectionOptions, RedisService } from '@furkanogutcu/nest-redis';
import { Provider } from '@nestjs/common';
import { QueueOptions } from 'bullmq';

export interface QueueConfig {
  name: string;
  options?: QueueOptions;
}

export interface BullBoardOptions {
  route: string;
  options?: BoardOptions;
  auth?: {
    username: string;
    password: string;
  };
}

export interface ConfigOptions {
  defaultQueueOptions?: QueueOptions;
}

export interface QueueModuleOptions {
  redis: RedisService | RedisConnectionOptions;
  queues?: QueueConfig[];
  config?: ConfigOptions;
  isGlobal?: boolean;
  bullBoard?: BullBoardOptions;
}

export interface QueueModuleAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<QueueModuleOptions> | QueueModuleOptions;
  inject?: any[];
  providers?: Provider[];
  isGlobal?: boolean;
}
