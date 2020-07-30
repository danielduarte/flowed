import { FlowState } from '.';
import { TaskResolverMap, ValueMap } from '../../types';
import { FlowStateEnum } from '../../types';
import { SerializedFlowRunStatus } from '../flow-run-status';

export class FlowReady extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Ready;
  }

  public start(
    params: ValueMap,
    expectedResults: string[],
    resolvers: TaskResolverMap,
    context: ValueMap,
    options: ValueMap = {},
  ): Promise<ValueMap> {
    this.setRunOptions(options);
    this.debug(`[${this.runStatus.id}] ▶ Flow started with params: %O`, params);

    this.setState(FlowStateEnum.Running);

    this.setExpectedResults([...expectedResults]);
    this.setResolvers(resolvers);
    this.setContext(context);
    this.supplyParameters(params);

    this.createFinishPromise();

    // Run tasks
    this.startReadyTasks();

    // Notify flow finished when flow has no tasks
    if (Object.keys(this.getSpec().tasks || {}).length === 0) {
      this.runStatus.state.finished();
    }

    return this.runStatus.finishPromise;
  }

  public getSerializableState(): SerializedFlowRunStatus {
    return this.runStatus.toSerializable();
  }
}
