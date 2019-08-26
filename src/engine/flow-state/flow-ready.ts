import { FlowRunning } from '.';
import { FlowState } from '.';
import { Flow } from '../';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum } from '../flow-types';

export class FlowReady extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Ready;

  private constructor() {
    super();
  }

  public start(
    flow: Flow,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    flow.state = FlowRunning.getInstance();

    flow.runStatus.expectedResults = [...expectedResults];
    flow.runStatus.resolvers = resolvers;

    flow.supplyParameters(params);

    flow.startReadyTasks();

    const finishPromise = flow.createFinishPromise();

    // Notify flow finished when flow has no tasks
    if (Object.keys(flow.spec.tasks).length === 0) {
      flow.finishResolve(flow.runStatus.results);
    }

    return finishPromise;
  }
}
