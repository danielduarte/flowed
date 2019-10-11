import { FlowState } from '.';
import { FlowStateEnum } from '../../types';

export class FlowFinished extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Finished;
  }

  public reset() {
    this.setState(FlowStateEnum.Ready);
    this.initRunStatus(this.runStatus.spec);
  }
}
