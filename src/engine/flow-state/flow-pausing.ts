import { FlowStateEnum } from '../../types';
import { FlowState } from './flow-state';

export class FlowPausing extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Pausing;
  }

  public paused(error: Error | boolean): void {
    this.setState(FlowStateEnum.Paused);

    if (error) {
      this.debug(`[${this.runStatus.id}] ⏸ Flow paused with error.`);
      this.execFinishReject(error as Error);
    } else {
      this.debug(`[${this.runStatus.id}] ⏸ Flow paused.`);
      this.execFinishResolve();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected postProcessFinished(error: Error | boolean, stopFlowExecutionOnError: boolean): void {
    this.runStatus.state.paused(error);
  }
}
