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

  public pause(flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(this.flow, FlowPausing.getInstance(this.flow));

    // @todo Send pause signal to tasks, when it is implemented
    return flowProtectedScope.createPausePromise.call(this.flow);
  }

  public stop(flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(this.flow, FlowStopping.getInstance(this.flow));

    // @todo Send stop signal to tasks, when it is implemented
    return flowProtectedScope.createStopPromise.call(this.flow);
  }

  public finished(flowProtectedScope: any, error: Error | boolean = false) {
    flowProtectedScope.setState.call(this.flow, FlowFinished.getInstance(this.flow));

    if (error) {
      debug(`[${this.flow.id}] ` + '✘ Flow finished with error. Results:', this.flow.getResults());
      flowProtectedScope.execFinishReject.call(this.flow, error);
    } else {
      debug(`[${this.flow.id}] ` + '✔ Flow finished with results:', this.flow.getResults());
      flowProtectedScope.execFinishResolve.call(this.flow);
    }
  }
}
