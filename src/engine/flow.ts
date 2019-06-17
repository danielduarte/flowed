/* tslint:disable:no-empty */
import { FlowSpec } from './flow-specs';
import { Task, TaskMap } from './task';

export class Flow {
  protected spec: FlowSpec;

  protected tasks: TaskMap;

  protected runStatus: FlowRunStatus;

  public constructor(spec: FlowSpec) {
    this.spec = spec;
    this.tasks = {};
    this.runStatus = {
      runningTasks: [],
      tasksReady: [],
      tasksByReq: {},
      resolvers: {},
      expectedResults: [],
      results: {},
      resolveFlowCallback: (results: GenericValueMap) => {}, // tslint:disable:no-empty
    };

    this.parseSpec();
  }

  public resetRunStatus() {
    // @todo Avoid initializing twice.
    this.runStatus = {
      runningTasks: [],
      tasksReady: [],
      tasksByReq: {},
      resolvers: {},
      expectedResults: [],
      results: {},
      resolveFlowCallback: (results: GenericValueMap) => {},
    };

    for (const taskCode in this.tasks) {
      if (this.tasks.hasOwnProperty(taskCode)) {
        const task = this.tasks[taskCode];
        task.resetRunStatus();

        if (task.isReadyToRun()) {
          this.runStatus.tasksReady.push(task);
        }

        const taskReqs = task.getSpec().requires;
        for (const req of taskReqs) {
          if (!this.runStatus.tasksByReq.hasOwnProperty(req)) {
            this.runStatus.tasksByReq[req] = {};
          }
          this.runStatus.tasksByReq[req][task.getCode()] = task;
        }
      }
    }

    this.printStatus();
  }

  public run(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    // @todo Check if it is not running already

    this.runStatus.expectedResults = [...expectedResults];
    this.runStatus.resolvers = resolvers;

    this.supplyParameters(params);
    this.startReadyTasks();

    return new Promise(resolve => {
      this.runStatus.resolveFlowCallback = resolve;
    });
  }

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public supplyResult(resultName: string, result: any) {
    const suppliesSomeTask = this.runStatus.tasksByReq.hasOwnProperty(resultName);

    // Checks if the task result is required by other tasks.
    // If it is not, it is probably a flow output value.
    if (suppliesSomeTask) {
      const suppliedTasks = this.runStatus.tasksByReq[resultName];
      const suppliedTaskCodes = Object.keys(suppliedTasks);
      for (const taskCode of suppliedTaskCodes) {
        const suppliedTask = suppliedTasks[taskCode];

        suppliedTask.supplyReq(resultName, result);
        delete suppliedTasks[taskCode];
        if (Object.keys(suppliedTasks).length === 0) {
          delete this.runStatus.tasksByReq[resultName];
        }

        if (suppliedTask.isReadyToRun()) {
          this.runStatus.tasksReady.push(suppliedTask);
        }
      }
    }

    // If the result is required as flow output, it is provided
    const isExpectedResult = this.runStatus.expectedResults.indexOf(resultName) > -1;
    if (isExpectedResult) {
      this.runStatus.results[resultName] = result;
    }
  }

  public printStatus() {
    // Uncomment to debug
    // console.log('▣ Run status:', this.runStatus);
  }

  protected parseSpec() {
    for (const taskCode in this.spec.tasks) {
      if (this.spec.tasks.hasOwnProperty(taskCode)) {
        const taskSpec = this.spec.tasks[taskCode];
        const task = new Task(taskCode, taskSpec);

        this.tasks[taskCode] = task;
      }
    }

    this.resetRunStatus();
  }

  protected supplyParameters(params: GenericValueMap) {
    for (const paramCode in params) {
      if (params.hasOwnProperty(paramCode)) {
        const paramValue = params[paramCode];
        this.supplyResult(paramCode, paramValue);
      }
    }
  }

  protected startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      this.runStatus.runningTasks.push(task.getCode());

      const hasResolver = this.runStatus.resolvers.hasOwnProperty(task.getResolverName());
      if (!hasResolver) {
        throw new Error(
          `Task resolver ${task.getResolverName()} for task ${task.getCode()} has no definition. Defined resolvers are [${Object.keys(
            this.runStatus.resolvers,
          ).join(', ')}].`,
        );
      }

      const taskResolver = this.runStatus.resolvers[task.getResolverName()];

      task.run(taskResolver).then(() => {
        this.taskFinished(task);
      });

      console.log(`► Task ${task.getCode()} started, params: `, task.getParams());
    }
  }

  protected taskFinished(task: Task) {
    const taskProvisions = task.getSpec().provides;
    const taskResults = task.getResults();

    console.log(`✔ Finished task ${task.getCode()}, results:`, taskResults);

    // Remove the task from running tasks collection
    this.runStatus.runningTasks.splice(this.runStatus.runningTasks.indexOf(task.getCode()), 1);

    for (const resultName of taskProvisions) {
      const result = taskResults[resultName];
      this.supplyResult(resultName, result);
    }

    this.printStatus();

    this.startReadyTasks();

    if (!this.isRunning()) {
      this.flowFinished(this.runStatus.results);
    }
  }

  protected flowFinished(results: GenericValueMap) {
    console.log('◼ Flow finished with results:', results);
    this.runStatus.resolveFlowCallback(results);
  }
}

export interface FlowRunStatus {
  runningTasks: string[];

  tasksReady: Task[];

  tasksByReq: {
    [req: string]: TaskMap;
  };

  resolvers: TaskResolverMap;

  expectedResults: string[];

  results: GenericValueMap;

  resolveFlowCallback: (results: GenericValueMap) => void;
}

export interface GenericValueMap {
  [key: string]: any;
}

export class TaskResolver {
  public exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(() => {});
  }
}

export type TaskResolverClass = typeof TaskResolver;

export class TaskResolverMap {
  [key: string]: TaskResolverClass;
}
