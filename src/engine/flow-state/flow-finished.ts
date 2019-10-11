import { FlowReady, FlowState } from '.';
import { Flow } from '../';
import { FlowStateEnum } from '../flow-types';

export class FlowFinished extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Finished);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Finished;
  }

  public reset(flowProtectedScope: any) {
    flowProtectedScope.setState.call(this.flow, FlowReady.getInstance(this.flow));
    flowProtectedScope.initRunStatus.call(this.flow);
  }
}
