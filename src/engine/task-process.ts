import { LooggerFn, TaskResolverClass, TaskResolverExecutor, TaskResolverFn, ValueMap } from '../types';
import { ProcessManager } from './process-manager';
import { Task } from './task';
import { Debugger } from 'debug';

export class TaskProcess {
  public static nextPid = 1;

  protected params!: ValueMap;

  /**
   * Process Id
   */
  public pid: number;

  constructor(
    public manager: ProcessManager,
    public id: number,
    public task: Task, // @todo convert to protected?
    protected taskResolverExecutor: TaskResolverExecutor,
    protected context: ValueMap,
    protected automapParams: boolean,
    protected automapResults: boolean,
    protected flowId: number,
    protected debug: Debugger,
    protected log: LooggerFn,
  ) {
    this.pid = TaskProcess.nextPid;
    TaskProcess.nextPid = (TaskProcess.nextPid + 1) % Number.MAX_SAFE_INTEGER;
  }

  public getParams(): ValueMap {
    return this.params;
  }

  public run(): Promise<ValueMap> {
    this.params = this.task.mapParamsForResolver(this.task.runStatus.solvedReqs.popAll(), this.automapParams, this.flowId, this.debug, this.log);

    const isClassResolver = this.taskResolverExecutor.prototype && this.taskResolverExecutor.prototype.exec;
    const resolverFn = isClassResolver ? new (this.taskResolverExecutor as TaskResolverClass)().exec : (this.taskResolverExecutor as TaskResolverFn);

    return new Promise((resolve, reject) => {
      const onResolverSuccess = (resolverValue: ValueMap): void => {
        const results = this.task.mapResultsFromResolver(resolverValue, this.automapResults, this.flowId, this.debug, this.log);
        this.task.runStatus.solvedResults = results;
        resolve(this.task.runStatus.solvedResults);
      };

      const onResolverError = (error: Error): void => {
        reject(error);
      };

      let resolverPromise; // @todo rename variable (it could be a non-Promise object)

      // @sonar start-ignore Ignore this block because try is required even when not await-ing for the promise
      try {
        resolverPromise = resolverFn(this.params, this.context, this.task, this.debug, this.log);
      } catch (error) {
        // @todo Add test to get this error here with a sync resolver that throws error after returning the promise
        onResolverError(error);
      }
      // @sonar end-ignore

      const resultIsObject = typeof resolverPromise === 'object';
      const resultIsPromise = resolverPromise && resolverPromise.constructor && resolverPromise.constructor.name === 'Promise';

      if (!resultIsObject) {
        throw new Error(
          `Expected resolver for task '${
            this.task.code
          }' to return an object or Promise that resolves to object. Returned value is of type '${typeof resolverPromise}'.`,
        );
      }

      if (resultIsPromise) {
        // Resolver returned a Promise<ValueMap>
        (resolverPromise as Promise<ValueMap>)
          .then(
            onResolverSuccess,
            onResolverError, // @todo Check if this is needed even having the .catch
          )
          .catch(onResolverError);
      } else {
        // Resolver returned a ValueMap
        onResolverSuccess(resolverPromise as ValueMap);
      }
    });
  }
}
