import { Job, WorkerOptions } from 'bullmq';

export abstract class BaseWorker {
  abstract get options(): Omit<WorkerOptions, 'connection' | 'name' | 'processor'> & { queueName: string };
  abstract process(job: Job): Promise<any>;
}
