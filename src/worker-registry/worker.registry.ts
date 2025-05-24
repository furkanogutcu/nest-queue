import { WorkerOptions } from '../types';
import { BaseWorker } from './base.worker';

export interface WorkerMetadata {
  queueName: string;
  options?: Omit<WorkerOptions, 'connection' | 'name' | 'processor'>;
}

export class WorkerRegistry {
  private static instance: WorkerRegistry;
  private readonly workersMetadata: Map<any, WorkerMetadata> = new Map();
  private readonly workerInstances: Map<string, BaseWorker> = new Map();

  private constructor() {}

  static getInstance(): WorkerRegistry {
    if (!WorkerRegistry.instance) {
      WorkerRegistry.instance = new WorkerRegistry();
    }

    return WorkerRegistry.instance;
  }

  register(target: any, metadata: WorkerMetadata): void {
    this.workersMetadata.set(target, metadata);
  }

  registerWorkerInstance(queueName: string, instance: BaseWorker): void {
    this.workerInstances.set(queueName, instance);
  }

  getWorkerInstance(queueName: string): BaseWorker | undefined {
    return this.workerInstances.get(queueName);
  }

  getWorkerMetadata(target: any): WorkerMetadata | undefined {
    return this.workersMetadata.get(target);
  }

  getAllWorkerMetadata(): Map<any, WorkerMetadata> {
    return this.workersMetadata;
  }
}
