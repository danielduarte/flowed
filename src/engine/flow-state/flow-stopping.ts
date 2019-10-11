import { FlowState } from '.';
import { FlowStateEnum } from '../../types';

export class FlowStopping extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopping;
  }

  public stopped() {
    this.setState(FlowStateEnum.Stopped);
    this.execStopResolve();
  }
}
