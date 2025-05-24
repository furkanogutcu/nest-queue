import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';

import { QueueService } from '../queue.service';
import { Job } from '../types';
import { BaseWorker } from './base.worker';
import { WorkerMetadata, WorkerRegistry } from './worker.registry';

@Injectable()
export class WorkerRegistryService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly workers: Worker[] = [];

  constructor(private readonly queueService: QueueService) {}

  onApplicationBootstrap(): void {
    const workersMetadata = WorkerRegistry.getInstance().getAllWorkerMetadata();

    if (workersMetadata.size === 0) {
      console.warn(
        'No queue workers found in the application. Make sure you use the @Worker decorator on your worker classes.',
      );
      return;
    }

    this.createBullMQWorkers(workersMetadata);
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeAllWorkers();
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
    const workerInstance = this.getWorkerInstance(queueName, targetClass);

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        return await workerInstance.process(job);
      },
      {
        connection: redisConnection,
        ...metadata.options,
      },
    );

    this.workers.push(worker);
  }

  private getWorkerInstance(queueName: string, targetClass: any): BaseWorker {
    const existingInstance = WorkerRegistry.getInstance().getWorkerInstance(queueName);

    if (existingInstance) {
      return existingInstance;
    }

    console.warn(
      `Worker instance for ${targetClass.name} not found in registry. ` +
        `Creating new instance. This may cause dependency injection issues.`,
    );

    const workerInstance = new targetClass() as BaseWorker;

    if (!('process' in workerInstance)) {
      throw new Error(
        `Worker class ${targetClass.name} does not implement the 'process' method. ` +
          `Make sure it extends BaseWorker class.`,
      );
    }

    return workerInstance;
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
  }
}
