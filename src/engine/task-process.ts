import { Debugger } from 'debug';
import { LoggerFn, TaskResolverClass, TaskResolverExecutor, TaskResolverFn, ValueMap } from '../types';
import { ProcessManager } from './process-manager';
import { Task } from './task';

export class TaskProcess {
  public static nextPid = 1;

  protected params!: ValueMap;

  /**
   * Process id
   */
  public pid: number;

  constructor(
    public manager: ProcessManager,
    public id: number,
    public task: Task,
    protected taskResolverExecutor: TaskResolverExecutor,
    protected context: ValueMap,
    protected automapParams: boolean,
    protected automapResults: boolean,
    protected flowId: number,
    protected debug: Debugger,
    protected log: LoggerFn,
  ) {
    this.pid = TaskProcess.nextPid;
    TaskProcess.nextPid = (TaskProcess.nextPid + 1) % Number.MAX_SAFE_INTEGER;
  }

  public getParams(): ValueMap {
    return this.params;
  }

  public run(): Promise<ValueMap> {
    this.params = this.task.mapParamsForResolver(this.task.runStatus.solvedReqs.popAll(), this.automapParams, this.flowId, this.log);

    let resolverFn = this.taskResolverExecutor as TaskResolverFn;
    let resolverThis: TaskResolverClass | undefined = undefined;
    const isClassResolver = this.taskResolverExecutor.prototype?.exec;
    if (isClassResolver) {
      // @todo try to remove type casts in this code section
      const resolverInstance = new (this.taskResolverExecutor as TaskResolverClass)();
      resolverFn = resolverInstance.exec;
      resolverThis = resolverInstance as unknown as TaskResolverClass;
    }

    return new Promise((resolve, reject) => {
      const onResolverSuccess = (resolverValue: ValueMap): void => {
        this.task.runStatus.solvedResults = this.task.mapResultsFromResolver(resolverValue, this.automapResults, this.flowId, this.log);
        resolve(this.task.runStatus.solvedResults);
      };

      const onResolverError = (error: Error): void => {
        reject(error);
      };

      let resolverResult;

      // @sonar start-ignore Ignore this block because try is required even when not await-ing for the promise
      try {
        resolverResult = resolverFn.call(resolverThis, this.params, this.context, this.task, this.debug, this.log);
      } catch (error) {
        // @todo Add test to get this error here with a sync resolver that throws error after returning the promise
        onResolverError(error as Error);
      }
      // @sonar end-ignore

      const resultIsObject = typeof resolverResult === 'object';
      const resultIsPromise = resolverResult?.constructor?.name === 'Promise';

      if (!resultIsObject) {
        throw new Error(
          `Expected resolver for task '${
            this.task.code
          }' to return an object or Promise that resolves to object. Returned value is of type '${typeof resolverResult}'.`,
        );
      }

      if (resultIsPromise) {
        // Resolver returned a Promise<ValueMap>
        (resolverResult as Promise<ValueMap>).then(onResolverSuccess).catch(onResolverError);
      } else {
        // Resolver returned a ValueMap
        onResolverSuccess(resolverResult as ValueMap);
      }
    });
  }
}
