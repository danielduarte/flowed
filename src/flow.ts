export interface TaskResolverSpec {

    name: string;

    params?: GenericValueMap;
}

export interface TaskSpec {

    requires?: string[];

    provides?: string;

    resolver: TaskResolverSpec;
}

export interface FlowSpec {

    tasks?: {
        [key: string]: TaskSpec
    };

    goal?: string;
}

export interface GenericValueMap {
    [key: string]: any;
}

export type TaskResolverClass = typeof TaskResolver;

export interface TaskResolverClassMap {
    [key: string]: TaskResolverClass;
}

export interface TaskResolverInterface {
    exec(params: GenericValueMap): any;
}

export class TaskResolver implements TaskResolverInterface {
    exec(params: GenericValueMap = {}): any {
        throw new Error(`This class must not be used directly. It must me extended.'`);
    }
}

export class FlowManager {

    static run(flowSpec: FlowSpec, params: GenericValueMap = {}, resolvers: TaskResolverClass[] = []) {

        const resolversMap: TaskResolverClassMap = {};
        for (let i = 0; i < resolvers.length; i++) {
            const resolverClass = resolvers[i];
            resolversMap[resolverClass.name] = resolverClass;
        }

        const flow = new Flow(flowSpec, resolversMap);
        return flow.run(params);
    }
}

export class Flow {

    protected spec: FlowSpec;

    protected resolvers: TaskResolverClassMap;

    protected tasksByGoal: {[key: string]: Task} = {};

    constructor(spec: FlowSpec, resolvers: TaskResolverClassMap) {
        this.spec = spec;
        this.resolvers = resolvers;

        const tasks = spec.tasks || {};

        for (let taskCode in tasks) if (tasks.hasOwnProperty(taskCode)) {
            const taskSpec = tasks[taskCode];
            const task = new Task(taskCode, taskSpec);
            const goalProvided = taskSpec.provides;
            if (goalProvided) {
                this.tasksByGoal[goalProvided] = task;
            }
        }
    }

    run(params: GenericValueMap = {}) {

        if (!this.spec.hasOwnProperty('goal')) {
            throw new Error(`The flow does not have a default goal specified.'`);
        }

        return this.provide(this.spec.goal || '', params);
    }

    provide(goal: string, externalParams: GenericValueMap = {}) {
        console.log('- Providing goal:', goal);
        const task = this.getTaskForGoal(goal);
        console.log('- Needs task', task.code);

        if (!this.resolvers.hasOwnProperty(task.spec.resolver.name)) {
            throw new Error(`Task resolver class not found '${task.spec.resolver.name}'.`);
        }

        const goalsRequired = task.getRequirements();
        const goalResults: GenericValueMap = {};
        for (let i = 0; i < goalsRequired.length; i++) {
            const requiredGoal = goalsRequired[i];

            if (externalParams.hasOwnProperty(requiredGoal)) {
                goalResults[requiredGoal] = externalParams[requiredGoal];
            } else {
                goalResults[requiredGoal] = this.provide(requiredGoal, externalParams);
            }
        }

        const params: GenericValueMap = {};
        for (let taskParam in task.spec.resolver.params) if (task.spec.resolver.params.hasOwnProperty(taskParam)) {
            const taskParamGoal = task.spec.resolver.params[taskParam];

            if (goalResults.hasOwnProperty(taskParamGoal)) {
                params[taskParam] = goalResults[taskParamGoal];
            }
        }

        const taskResult = task.run(params, this.resolvers[task.spec.resolver.name]);
        console.log('Task result:', taskResult);

        return taskResult;
    }


    getTaskForGoal(goal: string): Task {

        if (!this.tasksByGoal.hasOwnProperty(goal)) {
            throw new Error(`Flow definition error: Cannot satisfy goal '${goal}.'`);
        }

        return this.tasksByGoal[goal];
    }
}

export class Task {

    public code: string;

    public spec: TaskSpec;

    constructor(code: string, spec: TaskSpec) {
        this.code = code;
        this.spec = spec;
    }

    getRequirements() {
        return this.spec.requires || [];
    }

    run(params: GenericValueMap, resolverClass: TaskResolverClass): any {

        console.log(`+ Running task ${this.code}: ${this.spec.resolver.name}(`, params, ')');

        const resolver = new resolverClass();
        return resolver.exec(params);
    }
}
