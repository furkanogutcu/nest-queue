import { Redis, RedisService } from '@furkanogutcu/nest-redis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Processor, Worker, WorkerOptions } from 'bullmq';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private readonly workers: Map<string, Worker> = new Map();
  private readonly redisClient: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getClient();
  }

  create({
    queueName,
    processor,
    options,
  }: {
    queueName: string;
    processor: Processor;
    options?: Omit<WorkerOptions, 'connection'>;
  }): Worker {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      ...options,
      connection: this.redisClient,
    });

    this.workers.set(queueName, worker);

    return worker;
  }

  get(queueName: string): Worker {
    const worker = this.workers.get(queueName);

    if (!worker) {
      throw new Error(`No worker found for queue "${queueName}"`);
    }

    return worker;
  }

  getAll(): Worker[] {
    return Array.from(this.workers.values());
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private async close(): Promise<void> {
    const workers = this.getAll();

    await Promise.all(
      workers.map(async (worker) => {
        try {
          await worker.close();
        } catch (error) {
          console.error(`Error closing worker ${worker.name}:`, error);
        }
      }),
    );

    this.workers.clear();
  }
}
