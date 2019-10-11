import { FlowState } from '.';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';

export class FlowPaused extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Paused;
  }

  public resume() {
    this.setState(FlowStateEnum.Running);

    // @todo Send resume signal to tasks, when it is implemented
    this.startReadyTasks();

    if (!this.isRunning()) {
      this.runStatus.state.finished();
    }
  }

  public stop(): Promise<GenericValueMap> {
    this.setState(FlowStateEnum.Stopping);

    return Promise.resolve(this.getResults());
  }
}
