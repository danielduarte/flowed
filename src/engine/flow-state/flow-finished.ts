import { FlowReady, FlowState } from '.';
import { Flow } from '../';
import { FlowStateEnum } from '../flow-types';

export class FlowFinished extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Finished;
  }

  public reset(flow: Flow, flowProtectedScope: any) {
    flowProtectedScope.setState.call(flow, FlowReady.getInstance());
    flowProtectedScope.initRunStatus.call(flow);
  }
}
