import { Job as BullMQJob, WorkerOptions as BullMQWorkerOptions } from 'bullmq';

export type Job<T = any> = BullMQJob<T>;

export type WorkerOptions = BullMQWorkerOptions;
