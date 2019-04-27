import {FlowSpec} from './flow-specs';
import {Task, TaskMap} from './task';


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
            expectedResults: [],
            results: {},
            resolveFlowCallback: (results: GenericValueMap) => {},
        };

        this.parseSpec();
    }

    protected parseSpec() {
        for (const taskCode in this.spec.tasks) if (this.spec.tasks.hasOwnProperty(taskCode)) {
            const taskSpec = this.spec.tasks[taskCode];
            const task = new Task(taskCode, taskSpec);

            this.tasks[taskCode] = task;
        }

        this.resetRunStatus();
    }

    public resetRunStatus() {
        this.runStatus = {
            runningTasks: [],
            tasksReady: [],
            tasksByReq: {},
            expectedResults: [],
            results: {},
            resolveFlowCallback: (results: GenericValueMap) => {},
        };

        for (const taskCode in this.tasks) if (this.tasks.hasOwnProperty(taskCode)) {
            const task = this.tasks[taskCode];
            task.resetRunStatus();

            if (task.isReadyToRun()) {
                this.runStatus.tasksReady.push(task);
            }

            const taskReqs = task.getSpec().requires;
            for (let i = 0; i < taskReqs.length; i++) {
                const req = taskReqs[i];
                if (!this.runStatus.tasksByReq.hasOwnProperty(req)) {
                    this.runStatus.tasksByReq[req] = {};
                }
                this.runStatus.tasksByReq[req][task.getCode()] = task;
            }
        }

        this.printStatus();
    }

    public run(params: GenericValueMap = {}, expectedResults: string[] = []): Promise<GenericValueMap> {

        // @todo Check if it is not running already

        this.runStatus.expectedResults = [...expectedResults];
        this.supplyParameters(params);
        this.startReadyTasks();

        return new Promise(resolve => {
            this.runStatus.resolveFlowCallback = resolve;
        });
    }

    protected supplyParameters(params: GenericValueMap) {
        for (const paramCode in params) if (params.hasOwnProperty(paramCode)) {
            const paramValue = params[paramCode];
            this.supplyResult(paramCode, paramValue);
        }
    }

    public isRunning() {
        return this.runStatus.runningTasks.length > 0;
    }

    protected startReadyTasks() {

        const readyTasks = this.runStatus.tasksReady;
        this.runStatus.tasksReady = [];

        for (let i = 0; i < readyTasks.length; i++) {
            const task = readyTasks[i];

            this.runStatus.runningTasks.push(task.getCode());
            task.run().then(() => {
                this.taskFinished(task);
            });

            console.log(`► Task ${task.getCode()} started, params: `, task.getParams());
        }
    }

    protected taskFinished(task: Task) {
        const taskProvisions = task.getSpec().provides;
        const taskResults = task.getResults();

        console.log(`✔ Finished task ${task.getCode()}, results:`, taskResults);

        this.runStatus.runningTasks.splice(
            this.runStatus.runningTasks.indexOf(task.getCode()), 1
        );

        for (let i = 0; i < taskProvisions.length; i++) {
            const resultName = taskProvisions[i];
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

    public supplyResult(resultName: string, result: any) {
        const suppliesSomeTask = this.runStatus.tasksByReq.hasOwnProperty(resultName);

        // Checks if the task result is required by other tasks.
        // If it is not, it is probably a flow output value.
        if (suppliesSomeTask) {
            const suppliedTasks = this.runStatus.tasksByReq[resultName];
            const suppliedTaskCodes = Object.keys(suppliedTasks);
            for (let j = 0; j < suppliedTaskCodes.length; j++) {
                const taskCode = suppliedTaskCodes[j];
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
}

export interface FlowRunStatus {

    runningTasks: string[];

    tasksReady: Task[];

    tasksByReq: {
        [req: string]: TaskMap,
    };

    expectedResults: string[];

    results: GenericValueMap,

    resolveFlowCallback: (results: GenericValueMap) => void,
}

export interface GenericValueMap {
    [key: string]: any;
}
