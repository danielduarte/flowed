import { FlowState } from '.';
import { FlowStopping } from '.';
import { Flow } from '../';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
import { FlowRunning } from './flow-running';

export class FlowPaused extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Paused);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Paused;
  }

  public resume(flowProtectedScope: any) {
    flowProtectedScope.setState.call(this.flow, FlowRunning.getInstance(this.flow));

    // @todo Send resume signal to tasks, when it is implemented
    flowProtectedScope.startReadyTasks.call(this.flow);

    if (!this.flow.isRunning()) {
      flowProtectedScope.finished.call(this.flow);
    }
  }

  public stop(flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(this.flow, FlowStopping.getInstance(this.flow));

    return Promise.resolve(this.flow.getResults());
  }
}
