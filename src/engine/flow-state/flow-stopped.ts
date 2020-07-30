import { FlowState } from '.';
import { FlowStateEnum } from '../../types';
import { SerializedFlowRunStatus } from '../flow-run-status';

export class FlowStopped extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopped;
  }

  public reset(): void {
    this.setState(FlowStateEnum.Ready);
    this.runStatus.initRunStatus(this.runStatus.spec);
  }

  public getSerializableState(): SerializedFlowRunStatus {
    return this.runStatus.toSerializable();
  }
}
