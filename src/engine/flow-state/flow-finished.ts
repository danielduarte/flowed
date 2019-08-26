import { FlowReady, FlowState } from '.';
import { Flow } from '../';
import { FlowStateEnum } from '../flow-types';

export class FlowFinished extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Finished;

  private constructor() {
    super();
  }

  public reset(flow: Flow) {
    flow.state = FlowReady.getInstance();

    flow.initRunStatus();
  }
}
