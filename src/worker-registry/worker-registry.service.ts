import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';

import { QueueService } from '../queue.service';
import { Job } from '../types';
import { BaseWorker } from './base.worker';
import { WorkerMetadata, WorkerRegistry } from './worker.registry';

@Injectable()
export class WorkerRegistryService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly workers: Worker[] = [];
  private readonly workerInstances: Map<string, BaseWorker> = new Map();

  constructor(private readonly queueService: QueueService) {}

  onApplicationBootstrap(): void {
    const workersMetadata = WorkerRegistry.getInstance().getAll();

    if (this.hasNoWorkers(workersMetadata)) {
      return;
    }

    this.createBullMQWorkers(workersMetadata);
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeAllWorkers();
  }

  private hasNoWorkers(workersMetadata: Map<any, WorkerMetadata>): boolean {
    if (workersMetadata.size === 0) {
      console.warn(
        'No queue workers found in the application. Make sure you use the @Worker decorator on your worker classes.',
      );

      return true;
    }

    return false;
  }

  private createBullMQWorkers(workersMetadata: Map<any, WorkerMetadata>): void {
    const redisConnection = this.queueService.getRedisConnection();

    for (const [targetClass, metadata] of workersMetadata.entries()) {
      try {
        this.createWorker(targetClass, metadata, redisConnection);
      } catch (error) {
        console.error(`Failed to initialize worker for ${targetClass.name || 'Unknown'}:`, error);
      }
    }
  }

  private createWorker(targetClass: any, metadata: WorkerMetadata, redisConnection: any): void {
    const queueName = metadata.queueName;

    const workerInstance = new targetClass() as BaseWorker;

    if (!('process' in workerInstance)) {
      throw new Error(
        `Worker class ${targetClass.name} does not implement the 'process' method. Make sure it extends BaseWorker class.`,
      );
    }

    this.workerInstances.set(queueName, workerInstance);

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        const instance = this.workerInstances.get(queueName);

        if (!instance) {
          throw new Error(`No worker instance found for queue ${queueName}`);
        }

        return await instance.process(job);
      },
      {
        connection: redisConnection,
        ...metadata.options,
      },
    );

    this.workers.push(worker);
  }

  private async closeAllWorkers(): Promise<void> {
    await Promise.all(
      this.workers.map(async (worker) => {
        try {
          await worker.close();
        } catch (error) {
          console.error('Error closing worker:', error);
        }
      }),
    );

    this.workerInstances.clear();
  }
}
