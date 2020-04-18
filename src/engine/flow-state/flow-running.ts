import { FlowState } from '.';
import { ValueMap } from '../../types';
import { FlowStateEnum } from '../../types';

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

  public finished(error: Error | boolean = false) {
    this.setState(FlowStateEnum.Finished);

    if (error) {
      this.debug(`[${this.runStatus.id}] ✘ Flow finished with error. Results: %O`, this.getResults());
      this.execFinishReject(error as Error);
    } else {
      this.debug(`[${this.runStatus.id}] ✔ Flow finished with results: %O`, this.getResults());
      this.execFinishResolve();
    }
  }

  protected postProcessFinished(error: Error | boolean, stopFlowExecutionOnError: boolean) {
    const stopExecution = error && stopFlowExecutionOnError;
    if (!stopExecution) {
      this.runStatus.state.startReadyTasks();
    }

    if (!this.runStatus.state.isRunning()) {
      this.runStatus.state.finished(error);
    }
  }
}
