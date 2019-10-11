import { FlowStateEnum } from '../flow-types';
import { FlowState } from './flow-state';

export class FlowPausing extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Pausing;
  }

  public paused() {
    this.setState(FlowStateEnum.Paused);
    this.execPauseResolve();
  }
}
