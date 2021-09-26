import { FlowState } from '.';
import { TaskResolverMap, ValueMap, FlowStateEnum } from '../../types';
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
    this.log({ n: this.runStatus.id, m: 'Flow started with params: %O', mp: params, e: 'FS' });

    this.setState(FlowStateEnum.Running);

    this.setExpectedResults([...expectedResults]);
    this.setResolvers(resolvers);
    this.setContext(context);
    this.supplyParameters(params);

    this.createFinishPromise();

    // Run tasks
    this.startReadyTasks();

    // Notify 'flow finished' in advance when:
    // - there are no tasks ready to start (cannot execute anything because requirements are not satisfied), or
    // - there are no tasks at all in the flow spec.
    if (!this.runStatus.state.isRunning()) {
      this.runStatus.state.finished();
    }

    return this.runStatus.finishPromise;
  }

  public getSerializableState(): SerializedFlowRunStatus {
    return this.runStatus.toSerializable();
  }
}
