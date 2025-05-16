import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BaseAdapter } from '@bull-board/api/dist/src/queueAdapters/base';
import { ExpressAdapter } from '@bull-board/express';
import { Redis, RedisService } from '@furkanogutcu/nest-redis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Queue, QueueOptions } from 'bullmq';

import { QueueServiceOptions } from './interfaces';
import { BullBoardOptions, QueueConfig } from './interfaces/queue-module-options.interface';
import { createBullBoardAuthMiddleware } from './middlewares/bull-board-auth.middleware';
import { WorkerService } from './worker.service';
import { BaseWorker } from './workers/base.worker';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly options: QueueServiceOptions = {};

  constructor(
    redisService: RedisService,
    private readonly workerService: WorkerService,
    options: {
      queuesConfig?: QueueConfig[];
      redisKeyPrefix?: string;
      bullBoard?: BullBoardOptions;
      workers?: BaseWorker[];
    },
  ) {
    this.redisClient = redisService.getClient();

    this.options.redisKeyPrefix = options.redisKeyPrefix;
    this.options.bullBoard = options.bullBoard;

    this.initQueues(options.queuesConfig || []);

    if (options.workers && options.workers.length > 0) {
      this.initWorkers(options.workers);
    }
  }

  create(name: string, options?: QueueOptions): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queueOptions: QueueOptions = {
      connection: this.redisClient,
      ...options,
    };

    if (this.options.redisKeyPrefix && !queueOptions.prefix) {
      queueOptions.prefix = this.options.redisKeyPrefix;
    }

    const queue = new Queue(name, queueOptions);

    this.queues.set(name, queue);

    return queue;
  }

  get(name: string): Queue {
    const queue = this.queues.get(name);

    if (!queue) {
      throw new Error(`Queue with name "${name}" not found`);
    }

    return queue;
  }

  getAll(): Queue[] {
    return Array.from(this.queues.values());
  }

  bullBoard = {
    setup: (app: NestExpressApplication) => {
      if (!this.options.bullBoard) {
        return;
      }

      const serverAdapter = new ExpressAdapter();

      const bullBoardRoute = this.options.bullBoard.route.startsWith('/')
        ? this.options.bullBoard.route
        : `/${this.options.bullBoard.route}`;

      serverAdapter.setBasePath(bullBoardRoute);

      const queues = this.getAll();

      createBullBoard({
        queues: queues.map((queue) => {
          return new BullMQAdapter(queue);
        }) as BaseAdapter[],
        serverAdapter,
        options: this.options.bullBoard.options,
      });

      if (this.options.bullBoard.auth) {
        const authMiddleware = createBullBoardAuthMiddleware(this.options.bullBoard.auth);
        app.use(bullBoardRoute, authMiddleware);
      }

      app.use(bullBoardRoute, serverAdapter.getRouter());
    },
  };

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private async close(): Promise<void> {
    const queues = this.getAll();

    await Promise.all(
      queues.map(async (queue) => {
        try {
          await queue.close();
        } catch (error) {
          console.error(`Error closing queue ${queue.name}:`, error);
        }
      }),
    );

    this.queues.clear();
  }

  private initQueues(queuesConfig: QueueConfig[]): void {
    for (const queueConfig of queuesConfig) {
      this.create(queueConfig.name, queueConfig.options);
    }
  }

  private initWorkers(workers: BaseWorker[]): void {
    for (const worker of workers) {
      const { queueName, ...workerOptions } = worker.options;

      this.workerService.create({
        queueName,
        processor: worker.process,
        options: workerOptions,
      });
    }
  }
}
