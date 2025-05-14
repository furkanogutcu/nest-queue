import { RedisConnectionOptions, RedisService } from '@furkanogutcu/nest-redis';
import { Provider } from '@nestjs/common';
import { QueueOptions } from 'bullmq';

export interface QueueConfig {
  name: string;
  options?: QueueOptions;
}

export interface QueueModuleOptions {
  redis: RedisService | RedisConnectionOptions;
  queues?: QueueConfig[];
  redisKeyPrefix?: string;
  isGlobal?: boolean;
}

export interface QueueModuleAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<QueueModuleOptions> | QueueModuleOptions;
  inject?: any[];
  providers?: Provider[];
  isGlobal?: boolean;
}
