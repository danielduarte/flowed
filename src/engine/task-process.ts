import { TaskResolverClass, ValueMap } from '../types';
import { ProcessManager } from './process-manager';
import { Task } from './task';

export class TaskProcess {
  protected params!: ValueMap;

  constructor(
    public manager: ProcessManager,
    public id: number,
    public task: Task, // @todo convert to protected?
    protected taskResolverConstructor: TaskResolverClass,
    protected context: ValueMap,
    protected automapParams: boolean,
    protected automapResults: boolean,
    protected flowId: number,
  ) {}

  public getParams(): ValueMap {
    return this.params;
  }

  public run(): Promise<ValueMap> {
    this.params = this.task.mapParamsForResolver(this.task.runStatus.solvedReqs.popAll(), this.automapParams, this.flowId);
    const resolver = new this.taskResolverConstructor();

    return new Promise((resolve, reject) => {
      const onResolverSuccess = (resolverValue: ValueMap) => {
        const results = this.task.mapResultsFromResolver(resolverValue, this.automapResults, this.flowId);
        this.task.runStatus.solvedResults = results;
        resolve(this.task.runStatus.solvedResults);
      };

      const onResolverError = (error: Error) => {
        reject(error);
      };

      let resolverPromise;

      // @sonar start-ignore Ignore this block because try is required even when not await-ing for the promise
      try {
        resolverPromise = resolver.exec(this.params, this.context, this.task);
      } catch (error) {
        // @todo Add test to get this error here with a sync resolver that throws error after returning the promise
        onResolverError(error);
      }
      // @sonar end-ignore

      if (
        typeof resolverPromise !== 'object' ||
        typeof resolverPromise.constructor === 'undefined' ||
        resolverPromise.constructor.name !== 'Promise'
      ) {
        throw new Error(
          `Expected resolver for task '${
            this.task.code
          }' to return an object or Promise that resolves to object. Returned value is of type '${typeof resolverPromise}'.`,
        );
      }

      resolverPromise
        .then(
          onResolverSuccess,
          onResolverError, // @todo Check if this is needed even having the .catch
        )
        .catch(onResolverError);
    });
  }
}
