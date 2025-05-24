import { OnModuleInit } from '@nestjs/common';

import { Job } from '../types';
import { WorkerRegistry } from './worker.registry';

export abstract class BaseWorker implements OnModuleInit {
  abstract process(job: Job): Promise<any>;

  onModuleInit(): void {
    const metadata = WorkerRegistry.getInstance().getWorkerMetadata(this.constructor);

    if (metadata) {
      WorkerRegistry.getInstance().registerWorkerInstance(metadata.queueName, this);
    }
  }
}
