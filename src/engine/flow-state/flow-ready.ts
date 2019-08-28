import { FlowRunning } from '.';
import { FlowState } from '.';
import { Flow } from '../';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
import { FlowPausing } from './index';

export class FlowReady extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Ready;
  }

  public start(
    flow: Flow,
    flowProtectedScope: any,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(flow, FlowRunning.getInstance());

    flowProtectedScope.setExpectedResults.call(flow, [...expectedResults]);
    flowProtectedScope.setResolvers.call(flow, resolvers);
    flowProtectedScope.setContext.call(flow, context);
    flowProtectedScope.supplyParameters.call(flow, params);

    // Run tasks
    flowProtectedScope.startReadyTasks.call(flow);

    const finishPromise = flowProtectedScope.createFinishPromise.call(flow);

    // Notify flow finished when flow has no tasks
    if (Object.keys(flow.getSpec().tasks).length === 0) {
      flowProtectedScope.execFinishResolve.call(flow);
    }

    return finishPromise;
  }
}
