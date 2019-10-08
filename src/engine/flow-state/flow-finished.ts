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
