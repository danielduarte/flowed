import { Flow } from '../flow';
import { FlowStateEnum } from '../flow-types';
import { FlowPaused } from './flow-paused';
import { FlowState } from './flow-state';
import { FlowFinished } from './index';

export class FlowPausing extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Pausing;
  }

  public paused(flow: Flow, flowProtectedScope: any) {
    flowProtectedScope.setState.call(flow, FlowPaused.getInstance());
    flowProtectedScope.execPauseResolve.call(flow);
  }
}
