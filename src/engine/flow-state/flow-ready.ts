import { debug as rawDebug } from 'debug';
import { FlowState } from '.';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum } from '../../types';
const debug = rawDebug('flowed:flow');

export class FlowReady extends FlowState {
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

    this.setState(FlowStateEnum.Running);

    this.setExpectedResults([...expectedResults]);
    this.setResolvers(resolvers);
    this.setContext(context);
    this.supplyParameters(params);

    // Run tasks
    this.startReadyTasks();

    const finishPromise = this.createFinishPromise();

    // Notify flow finished when flow has no tasks
    if (Object.keys(this.getSpec().tasks || {}).length === 0) {
      this.runStatus.state.finished();
    }

    return finishPromise;
  }
}
