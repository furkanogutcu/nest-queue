import { WorkerOptions } from '../types';

export interface WorkerMetadata {
  queueName: string;
  options?: Omit<WorkerOptions, 'connection' | 'name' | 'processor'>;
}

export class WorkerRegistry {
  private static instance: WorkerRegistry;
  private readonly workersMetadata: Map<any, WorkerMetadata> = new Map();

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

  get(target: any): WorkerMetadata | undefined {
    return this.workersMetadata.get(target);
  }

  getAll(): Map<any, WorkerMetadata> {
    return this.workersMetadata;
  }
}
