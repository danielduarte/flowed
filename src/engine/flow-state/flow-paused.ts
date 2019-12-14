import { FlowState } from '.';
import { ValueMap } from '../../types';
import { FlowStateEnum } from '../../types';

export class FlowPaused extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Paused;
  }

  public resume(): Promise<ValueMap> {
    this.setState(FlowStateEnum.Running);

    this.createFinishPromise();

    this.startReadyTasks();

    if (!this.runStatus.state.isRunning()) {
      this.runStatus.state.finished();
    }

    return this.runStatus.finishPromise;
  }

  public stop(): Promise<ValueMap> {
    this.setState(FlowStateEnum.Stopping);

    return Promise.resolve(this.getResults());
  }

  public getSerializableState() {
    return this.runStatus.toSerializable();
  }
}
