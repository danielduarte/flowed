import { FlowState } from '.';
import { FlowStopping } from '.';
import { Flow } from '../';
import { GenericValueMap } from '../../types';
import { FlowStateEnum } from '../flow-types';
import { FlowRunning } from './flow-running';

export class FlowPaused extends FlowState {
  public static getInstance(): FlowState {
    return this.instance || (this.instance = new this());
  }

  protected static instance: FlowState;

  protected static stateCode = FlowStateEnum.Paused;

  private constructor() {
    super();
  }

  public resume(flow: Flow) {
    flow.state = FlowRunning.getInstance();

    // @todo Send resume signal to tasks, when it is implemented
    flow.startReadyTasks();

    if (!flow.isRunning()) {
      flow.flowFinished();
    }
  }

  public stop(flow: Flow): Promise<GenericValueMap> {
    flow.state = FlowStopping.getInstance();

    return Promise.resolve(flow.runStatus.results);
  }
}
