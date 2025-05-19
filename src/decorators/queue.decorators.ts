import { WorkerOptions } from '../types';
import { WorkerRegistry } from '../worker-registry';

export function Worker(
  queueName: string,
  options?: Omit<WorkerOptions, 'connection' | 'name' | 'processor'>,
): ClassDecorator {
  return (target: any) => {
    WorkerRegistry.getInstance().register(target, {
      queueName,
      options,
    });
  };
}
