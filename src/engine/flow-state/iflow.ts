import { Flow } from '..';
import { GenericValueMap, TaskResolverMap } from '../../types';

export interface IFlow {
  start(
    flow: Flow,
    flowProtectedScope: any,
    params: GenericValueMap,
    expectedResults: string[],
    resolvers: TaskResolverMap,
    context: GenericValueMap,
  ): Promise<GenericValueMap>;

  pause(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap>;

  resume(flow: Flow, flowProtectedScope: any): void;

  stop(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap>;

  reset(flow: Flow, flowProtectedScope: any): void;
}
