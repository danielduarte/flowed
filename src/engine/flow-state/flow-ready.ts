import { debug as rawDebug } from 'debug';
import { FlowRunning } from '.';
import { FlowState } from '.';
import { Flow } from '../';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
const debug = rawDebug('flowed:flow');

export class FlowReady extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Ready);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Ready;
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
    flowProtectedScope: any,
  ): Promise<GenericValueMap> {
    debug(`[${this.flow.id}] ` + '▶ Flow started with params:', params);

    flowProtectedScope.setState.call(this.flow, FlowRunning.getInstance(this.flow));

    flowProtectedScope.setExpectedResults.call(this.flow, [...expectedResults]);
    flowProtectedScope.setResolvers.call(this.flow, resolvers);
    flowProtectedScope.setContext.call(this.flow, context);
    flowProtectedScope.supplyParameters.call(this.flow, params);

    // Run tasks
    flowProtectedScope.startReadyTasks.call(this.flow);

    const finishPromise = flowProtectedScope.createFinishPromise.call(this.flow);

    // Notify flow finished when flow has no tasks
    if (Object.keys(this.flow.getSpec().tasks || {}).length === 0) {
      flowProtectedScope.finished.call(this.flow);
    }

    return finishPromise;
  }
}
