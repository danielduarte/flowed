import { AnyValue, FlowStateEnum, OptPromise, TaskResolverMap, ValueMap } from '../../types';

export interface IFlow {
  start(params: ValueMap, expectedResults: string[], resolvers: TaskResolverMap, context: ValueMap): OptPromise<ValueMap>;

  pause(): OptPromise<ValueMap>;

  resume(): OptPromise<ValueMap>;

  stop(): OptPromise<ValueMap>;

  reset(): void;

  getStateCode(): FlowStateEnum;

  debug(formatter: string, ...args: AnyValue[]): void;
}
