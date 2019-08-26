import { FlowFinished } from '.';
import { FlowPausing } from '.';
import { FlowState } from '.';
import { FlowStopping } from '.';
import { Flow } from '../';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';

export class FlowRunning extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Running;

  private constructor() {
    super();
  }

  public pause(flow: Flow): Promise<GenericValueMap> {
    flow.state = FlowPausing.getInstance();

    // @todo Send pause signal to tasks, when it is implemented
    return flow.createPausePromise();
  }

  public stop(flow: Flow): Promise<GenericValueMap> {
    flow.state = FlowStopping.getInstance();

    // @todo Send stop signal to tasks, when it is implemented
    return flow.createStopPromise();
  }

  public finished(flow: Flow) {
    flow.state = FlowFinished.getInstance();

    flow.finishResolve(flow.runStatus.results);
  }
}
