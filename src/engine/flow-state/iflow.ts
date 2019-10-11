import { GenericValueMap, TaskResolverMap } from '../../types';

export interface IFlow {
  start(
    params: GenericValueMap,
    expectedResults: string[],
    resolvers: TaskResolverMap,
    context: GenericValueMap,
    flowProtectedScope: any,
  ): Promise<GenericValueMap>;

  pause(flowProtectedScope: any): Promise<GenericValueMap>;

  resume(flowProtectedScope: any): void;

  stop(flowProtectedScope: any): Promise<GenericValueMap>;

  reset(flowProtectedScope: any): void;
}
