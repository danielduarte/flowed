import { FlowState } from '.';
import { ValueMap, FlowStateEnum } from '../../types';

export class FlowRunning extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Running;
  }

  public pause(): Promise<ValueMap> {
    this.setState(FlowStateEnum.Pausing);

    return this.runStatus.finishPromise;
  }

  public stop(): Promise<ValueMap> {
    this.setState(FlowStateEnum.Stopping);

    return this.runStatus.finishPromise;
  }

  public finished(error: Error | boolean = false): void {
    this.setState(FlowStateEnum.Finished);

    if (error) {
      this.log({ n: this.runStatus.id, m: 'Flow finished with error. Results: %O', mp: this.getResults(), l: 'e', e: 'FF' });
      this.execFinishReject(error as Error);
    } else {
      this.log({ n: this.runStatus.id, m: 'Flow finished with results: %O', mp: this.getResults(), e: 'FF' });
      this.execFinishResolve();
    }
  }

  protected postProcessFinished(error: Error | boolean, stopFlowExecutionOnError: boolean): void {
    const stopExecution = error && stopFlowExecutionOnError;
    if (!stopExecution) {
      this.runStatus.state.startReadyTasks();
    }

    if (!this.runStatus.state.isRunning()) {
      this.runStatus.state.finished(error);
    }
  }
}
