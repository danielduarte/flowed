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
  ): Promise<GenericValueMap> {
    debug(`[${this.runStatus.id}] ` + '▶ Flow started with params:', params);

    this.setState(FlowRunning.getInstance(this.flow));

    this.flow.setExpectedResults([...expectedResults]);
    this.flow.setResolvers(resolvers);
    this.flow.setContext(context);
    this.flow.supplyParameters(params);

    // Run tasks
    this.flow.startReadyTasks();

    const finishPromise = this.flow.createFinishPromise();

    // Notify flow finished when flow has no tasks
    if (Object.keys(this.flow.getSpec().tasks || {}).length === 0) {
      this.flow.finished();
    }

    return finishPromise;
  }
}
