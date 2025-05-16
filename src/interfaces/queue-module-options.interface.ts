import { BoardOptions } from '@bull-board/api/dist/typings/app';
import { RedisConnectionOptions, RedisService } from '@furkanogutcu/nest-redis';
import { Provider } from '@nestjs/common';
import { QueueOptions } from 'bullmq';

import { BaseWorker } from '../workers/base.worker';

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

export interface QueueModuleOptions {
  redis: RedisService | RedisConnectionOptions;
  queues?: QueueConfig[];
  redisKeyPrefix?: string;
  isGlobal?: boolean;
  bullBoard?: BullBoardOptions;
  workers?: BaseWorker[];
}

export interface QueueModuleAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<QueueModuleOptions> | QueueModuleOptions;
  inject?: any[];
  providers?: Provider[];
  isGlobal?: boolean;
}
