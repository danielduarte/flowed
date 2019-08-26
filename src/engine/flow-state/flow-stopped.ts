import { FlowState } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';
import { FlowReady } from './flow-ready';

export class FlowStopped extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Stopped;

  private constructor() {
    super();
  }

  public reset(flow: Flow) {
    flow.state = FlowReady.getInstance();

    flow.initRunStatus();
  }
}
