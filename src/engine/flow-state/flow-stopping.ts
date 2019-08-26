import { FlowState } from '.';
import { FlowStopped } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';

export class FlowStopping extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopping;
  }

  public stopped(flow: Flow, flowProtectedScope: any) {
    flowProtectedScope.setState.call(flow, FlowStopped.getInstance());
    flowProtectedScope.execStopResolve.call(flow);
  }
}
