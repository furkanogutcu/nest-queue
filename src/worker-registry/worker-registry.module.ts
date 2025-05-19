import { Module } from '@nestjs/common';

import { WorkerRegistryService } from './worker-registry.service';

@Module({
  providers: [WorkerRegistryService],
  exports: [WorkerRegistryService],
})
export class WorkerRegistryModule {}
