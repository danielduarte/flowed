import { GenericValueMap, TaskResolverClass } from '../types';
import { ProcessManager } from './process-manager';
import { Task } from './task';

export class TaskProcess {
  protected params!: GenericValueMap;

  constructor(
    public manager: ProcessManager,
    public id: number,
    public task: Task, // @todo convert to protected?
    protected taskResolverConstructor: TaskResolverClass,
    protected context: GenericValueMap,
    protected automapParams: boolean,
    protected automapResults: boolean,
    protected flowId: number,
  ) {}

  public getParams(): GenericValueMap {
    return this.params;
  }

  public run(): Promise<GenericValueMap> {
    this.params = this.task.mapParamsForResolver(this.task.runStatus.solvedReqs.popAll(), this.automapParams, this.flowId);
    const resolver = new this.taskResolverConstructor();

    return new Promise((resolve, reject) => {
      const onResolverSuccess = (resolverValue: GenericValueMap) => {
        const results = this.task.mapResultsFromResolver(resolverValue, this.automapResults, this.flowId);
        this.task.runStatus.solvedResults = results;
        resolve(this.task.runStatus.solvedResults);
      };

      const onResolverError = (error: Error) => {
        reject(error);
      };

      let resolverPromise;
      try {
        resolverPromise = resolver.exec(this.params, this.context, this.task);
      } catch (error) {
        onResolverError(error);
      }

      if (
        typeof resolverPromise !== 'object' ||
        typeof resolverPromise.constructor === 'undefined' ||
        resolverPromise.constructor.name !== 'Promise'
      ) {
        throw new Error(
          `Expected resolver for task '${this.task.getCode()}' to return an object or Promise that resolves to object. Returned value is of type '${typeof resolverPromise}'.`,
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
