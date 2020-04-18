import { FlowState } from '.';
import { FlowStateEnum } from '../../types';

export class FlowStopping extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopping;
  }

  public stopped(error: Error | boolean = false) {
    this.setState(FlowStateEnum.Stopped);

    if (error) {
      this.debug(`[${this.runStatus.id}] ◼ Flow stopped with error.`);
      this.execFinishReject(error as Error);
    } else {
      this.debug(`[${this.runStatus.id}] ◼ Flow stopped.`);
      this.execFinishResolve();
    }
  }

  protected postProcessFinished(error: Error | boolean, stopFlowExecutionOnError: boolean) {
    this.runStatus.state.stopped(error);
  }
}
