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
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  private constructor() {
    super();
  }

  public getStateCode(): FlowStateEnum {
    return FlowStateEnum.Running;
  }

  public pause(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(flow, FlowPausing.getInstance());

    // @todo Send pause signal to tasks, when it is implemented
    return flowProtectedScope.createPausePromise.call(flow);
  }

  public stop(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    flowProtectedScope.setState.call(flow, FlowStopping.getInstance());

    // @todo Send stop signal to tasks, when it is implemented
    return flowProtectedScope.createStopPromise.call(flow);
  }

  public finished(flow: Flow, flowProtectedScope: any) {
    debug('◼ Flow finished with results:', flow.getResults());

    flowProtectedScope.setState.call(flow, FlowFinished.getInstance());
    flowProtectedScope.execFinishResolve.call(flow);
  }
}
