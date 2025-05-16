import { RedisService } from '@furkanogutcu/nest-redis';
import { DynamicModule, Module, Provider } from '@nestjs/common';

import { QUEUE_MODULE_OPTIONS } from './constants/queue.constants';
import { QueueModuleAsyncOptions, QueueModuleOptions } from './interfaces/queue-module-options.interface';
import { QueueService } from './queue.service';
import { WorkerService } from './worker.service';

@Module({})
export class QueueModule {
  static register(options: QueueModuleOptions): DynamicModule {
    const providers = [
      {
        provide: QUEUE_MODULE_OPTIONS,
        useValue: options,
      },
      {
        provide: QueueService,
        useFactory: () => {
          let redisService: RedisService;

          if (!options.redis) {
            throw new Error('Redis configuration must be provided');
          }

          if (options.redis instanceof RedisService) {
            redisService = options.redis;
          } else {
            redisService = new RedisService(options.redis);
          }

          const workerService = new WorkerService(redisService);

          return new QueueService(redisService, workerService, {
            queuesConfig: options.queues,
            redisKeyPrefix: options.redisKeyPrefix,
            bullBoard: options.bullBoard,
            workers: options.workers,
          });
        },
      },
    ];

    return {
      module: QueueModule,
      providers,
      exports: [QueueService],
      global: options.isGlobal ?? false,
    };
  }

  static registerAsync(options: QueueModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      ...(options.providers || []),
      {
        provide: QUEUE_MODULE_OPTIONS,
        useFactory: options.useFactory || (() => ({})),
        inject: options.inject || [],
      },
      {
        provide: QueueService,
        useFactory: (moduleOptions: QueueModuleOptions) => {
          let redisService: RedisService;

          if (!moduleOptions.redis) {
            throw new Error('Redis configuration must be provided');
          }

          if (moduleOptions.redis instanceof RedisService) {
            redisService = moduleOptions.redis;
          } else {
            redisService = new RedisService(moduleOptions.redis);
          }

          const workerService = new WorkerService(redisService);

          return new QueueService(redisService, workerService, {
            queuesConfig: moduleOptions.queues,
            redisKeyPrefix: moduleOptions.redisKeyPrefix,
            bullBoard: moduleOptions.bullBoard,
            workers: moduleOptions.workers,
          });
        },
        inject: [QUEUE_MODULE_OPTIONS],
      },
    ];

    return {
      module: QueueModule,
      imports: options.imports || [],
      providers,
      exports: [QueueService],
      global: options.isGlobal ?? false,
    };
  }
}
