import { FlowStateEnum, GenericValueMap, TaskResolverMap } from '../../types';

export interface IFlow {
  start(params: GenericValueMap, expectedResults: string[], resolvers: TaskResolverMap, context: GenericValueMap): Promise<GenericValueMap>;

  pause(): Promise<GenericValueMap>;

  resume(): Promise<GenericValueMap>;

  stop(): Promise<GenericValueMap>;

  reset(): void;

  getStateCode(): FlowStateEnum;
}
