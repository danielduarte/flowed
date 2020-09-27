import { FlowState } from '.';
import { FlowStateEnum } from '../../types';

export class FlowStopping extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopping;
  }

  public stopped(error: Error | boolean = false): void {
    this.setState(FlowStateEnum.Stopped);

    if (error) {
      this.log({ n: this.runStatus.id, m: 'Flow stopped with error.', e: 'FT' });
      this.execFinishReject(error as Error);
    } else {
      this.log({ n: this.runStatus.id, m: 'Flow stopped.', e: 'FT' });
      this.execFinishResolve();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected postProcessFinished(error: Error | boolean, stopFlowExecutionOnError: boolean): void {
    this.runStatus.state.stopped(error);
  }
}
