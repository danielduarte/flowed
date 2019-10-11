import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowRunStatus } from '../flow-types';

export interface IFlow {
  /**
   * Flow run status information. It holds all the data related to the flow execution.
   */
  runStatus: FlowRunStatus;

  start(
    params: GenericValueMap,
    expectedResults: string[],
    resolvers: TaskResolverMap,
    context: GenericValueMap,
  ): Promise<GenericValueMap>;

  pause(): Promise<GenericValueMap>;

  resume(): void;

  stop(): Promise<GenericValueMap>;

  reset(): void;
}
