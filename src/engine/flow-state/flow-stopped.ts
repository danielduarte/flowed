import { FlowState } from '.';
import { FlowStateEnum } from '../../types';

export class FlowStopped extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Stopped;
  }

  public reset() {
    this.setState(FlowStateEnum.Ready);
    this.initRunStatus(this.runStatus.spec);
  }

  public getSerializableState() {
    return {
      runningTasks: this.runStatus.runningTasks,
      tasksReady: this.runStatus.tasksReady,
      tasksByReq: this.runStatus.tasksByReq,
      expectedResults: this.runStatus.expectedResults,
      results: this.runStatus.results,
    };
  }
}
