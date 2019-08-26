import { FlowState } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';
import { FlowReady } from './flow-ready';

export class FlowStopped extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopped;
  }

  public reset(flow: Flow, flowProtectedScope: any) {
    flowProtectedScope.setState.call(flow, FlowReady.getInstance());
    flowProtectedScope.initRunStatus.call(flow);
  }
}
