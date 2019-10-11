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

  public paused(flowProtectedScope: any) {
    flowProtectedScope.setState.call(this.flow, FlowPaused.getInstance(this.flow));
    flowProtectedScope.execPauseResolve.call(this.flow);
  }
}
