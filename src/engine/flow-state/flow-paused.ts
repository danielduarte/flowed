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

  public resume() {
    this.setState(FlowRunning.getInstance(this.flow));

    // @todo Send resume signal to tasks, when it is implemented
    this.flow.startReadyTasks();

    if (!this.isRunning()) {
      this.flow.finished();
    }
  }

  public stop(): Promise<GenericValueMap> {
    this.setState(FlowStopping.getInstance(this.flow));

    return Promise.resolve(this.flow.getResults());
  }
}
