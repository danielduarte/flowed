import { FlowState } from '.';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../../types';

export class FlowPaused extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Paused;
  }

  public resume(): Promise<GenericValueMap> {
    this.setState(FlowStateEnum.Running);

    this.createFinishPromise();

    // @todo Send resume signal to tasks, when it is implemented
    this.startReadyTasks();

    if (!this.runStatus.state.isRunning()) {
      this.runStatus.state.finished();
    }

    return this.runStatus.finishPromise;
  }

  public stop(): Promise<GenericValueMap> {
    this.setState(FlowStateEnum.Stopping);

    return Promise.resolve(this.getResults());
  }

  public getSerializableState() {
    return this.runStatus.toSerializable();
  }
}
