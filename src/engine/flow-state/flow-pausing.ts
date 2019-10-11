import { Flow } from '../flow';
import { FlowStateEnum } from '../flow-types';
import { FlowPaused } from './flow-paused';
import { FlowState } from './flow-state';

export class FlowPausing extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Pausing);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Pausing;
  }

  public paused() {
    this.setState(FlowPaused.getInstance(this.flow));
    this.execPauseResolve();
  }
}
