import { Job } from '../types';

export abstract class BaseWorker {
  abstract process(job: Job): Promise<any>;
}
