import { FlowPaused } from '.';
import { FlowState } from '.';
import { Flow } from '../';
import { FlowStateEnum } from '../flow-types';

export class FlowPausing extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Pausing;

  private constructor() {
    super();
  }

  public paused(flow: Flow) {
    flow.state = FlowPaused.getInstance();

    flow.pauseResolve(flow.runStatus.results);
  }
}
