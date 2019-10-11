import { debug as rawDebug } from 'debug';
import { FlowFinished } from '.';
import { FlowPausing } from '.';
import { FlowState } from '.';
import { FlowStopping } from '.';
import { Flow } from '../';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
const debug = rawDebug('flowed:flow');

export class FlowRunning extends FlowState {
  public static getInstance(flow: Flow): FlowState {
    return flow.getStateInstance(FlowStateEnum.Running);
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Running;
  }

  public pause(): Promise<GenericValueMap> {
    this.setState(FlowPausing.getInstance(this.flow));

    // @todo Send pause signal to tasks, when it is implemented
    return this.flow.createPausePromise();
  }

  public stop(): Promise<GenericValueMap> {
    this.setState(FlowStopping.getInstance(this.flow));

    // @todo Send stop signal to tasks, when it is implemented
    return this.flow.createStopPromise();
  }

  public finished(error: Error | boolean = false) {
    this.setState(FlowFinished.getInstance(this.flow));

    if (error) {
      debug(`[${this.runStatus.id}] ` + '✘ Flow finished with error. Results:', this.flow.getResults());
      this.execFinishReject(error as Error);
    } else {
      debug(`[${this.runStatus.id}] ` + '✔ Flow finished with results:', this.flow.getResults());
      this.execFinishResolve();
    }
  }
}
