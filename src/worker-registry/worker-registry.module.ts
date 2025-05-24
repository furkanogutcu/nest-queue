import { Global, Module } from '@nestjs/common';

import { WorkerRegistryService } from './worker-registry.service';

@Global()
@Module({
  providers: [WorkerRegistryService],
  exports: [WorkerRegistryService],
})
export class WorkerRegistryModule {}
