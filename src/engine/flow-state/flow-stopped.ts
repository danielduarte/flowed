import { FlowState } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';
import { FlowReady } from './flow-ready';

export class FlowStopped extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Stopped);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopped;
  }

  public reset(flowProtectedScope: any) {
    flowProtectedScope.setState.call(this.flow, FlowReady.getInstance(this.flow));
    flowProtectedScope.initRunStatus.call(this.flow);
  }
}
