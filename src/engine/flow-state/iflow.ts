import { FlowStateEnum, TaskResolverMap, ValueMap } from '../../types';

export interface IFlow {
  start(params: ValueMap, expectedResults: string[], resolvers: TaskResolverMap, context: ValueMap): Promise<ValueMap>;

  pause(): Promise<ValueMap>;

  resume(): Promise<ValueMap>;

  stop(): Promise<ValueMap>;

  reset(): void;

  getStateCode(): FlowStateEnum;
}
