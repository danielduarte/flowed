import { debug as rawDebug } from 'debug';
import { FlowState } from '.';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../../types';
const debug = rawDebug('flowed:flow');

export class FlowRunning extends FlowState {
  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Running;
  }

  public pause(): Promise<GenericValueMap> {
    this.setState(FlowStateEnum.Pausing);

    // @todo Send pause signal to tasks, when it is implemented
    return this.createPausePromise();
  }

  public stop(): Promise<GenericValueMap> {
    this.setState(FlowStateEnum.Stopping);

    // @todo Send stop signal to tasks, when it is implemented
    return this.createStopPromise();
  }

  public finished(error: Error | boolean = false) {
    this.setState(FlowStateEnum.Finished);

    if (error) {
      debug(`[${this.runStatus.id}] ✘ Flow finished with error. Results:`, this.getResults());
      this.execFinishReject(error as Error);
    } else {
      debug(`[${this.runStatus.id}] ✔ Flow finished with results:`, this.getResults());
      this.execFinishResolve();
    }
  }
}
