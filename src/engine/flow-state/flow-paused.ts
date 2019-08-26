import { FlowState } from '.';
import { FlowStopping } from '.';
import { Flow } from '../';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
import { FlowRunning } from './flow-running';

export class FlowPaused extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Paused;
  }

  public resume(flow: Flow, flowProtectedScope: any) {
    flowProtectedScope.setState.call(flow, FlowRunning.getInstance());

    // @todo Send resume signal to tasks, when it is implemented
    flowProtectedScope.startReadyTasks.call(flow);

    if (!flow.isRunning()) {
      flowProtectedScope.finished.call(flow);
    }
  }

  public stop(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(flow, FlowStopping.getInstance());

    return Promise.resolve(flow.getResults());
  }
}
