import { FlowStateEnum } from '../../types';
import { FlowState } from './flow-state';

export class FlowPausing extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Pausing;
  }

  public paused(error: Error | boolean): void {
    this.setState(FlowStateEnum.Paused);

    if (error) {
      this.log({ n: this.runStatus.id, m: 'Flow paused with error.', e: 'FP' });

      this.execFinishReject(error as Error);
    } else {
      this.log({ n: this.runStatus.id, m: 'Flow paused.', e: 'FP' });

      this.execFinishResolve();
    }
  }

  protected postProcessFinished(error: Error | boolean, _stopFlowExecutionOnError: boolean): void {
    this.runStatus.state.paused(error);
  }
}
