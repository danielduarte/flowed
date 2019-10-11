import { FlowState } from '.';
import { FlowStopped } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';

export class FlowStopping extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Stopping);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopping;
  }

  public stopped(flowProtectedScope: any) {
    flowProtectedScope.setState.call(this.flow, FlowStopped.getInstance(this.flow));
    flowProtectedScope.execStopResolve.call(this.flow);
  }
}
