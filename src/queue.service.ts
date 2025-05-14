import { Redis, RedisService } from '@furkanogutcu/nest-redis';
import { Injectable } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';

import { QueueConfig } from './interfaces/queue-module-options.interface';

@Injectable()
export class QueueService {
  private readonly client: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly defaultRedisKeyPrefix?: string;

  constructor(options: { redisService: RedisService; queuesConfig?: QueueConfig[]; defaultRedisKeyPrefix?: string }) {
    this.client = options.redisService.getClient();
    this.defaultRedisKeyPrefix = options.defaultRedisKeyPrefix;
    this.initQueues(options.queuesConfig || []);
  }

  create(name: string, options?: QueueOptions): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queueOptions: QueueOptions = {
      connection: this.client,
      ...options,
    };

    if (this.defaultRedisKeyPrefix && !queueOptions.prefix) {
      queueOptions.prefix = this.defaultRedisKeyPrefix;
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

  private initQueues(queuesConfig: QueueConfig[]): void {
    for (const queueConfig of queuesConfig) {
      this.create(queueConfig.name, queueConfig.options);
    }
  }
}
