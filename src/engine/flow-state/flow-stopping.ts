import { FlowState } from '.';
import { FlowStopped } from '.';
import { Flow } from '..';
import { FlowStateEnum } from '../flow-types';

export class FlowStopping extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Stopping;

  private constructor() {
    super();
  }

  public stopped(flow: Flow) {
    flow.state = FlowStopped.getInstance();

    flow.stopResolve(flow.runStatus.results);
  }
}
