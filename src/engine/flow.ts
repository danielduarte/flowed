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
            tasksReady: [],
            tasksByReq: {},
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
            tasksReady: [],
            tasksByReq: {},
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

    public run(params: GenericValueMap = {}) {

        this.supplyParameters(params);
        this.startReadyTasks();
    }

    protected supplyParameters(params: GenericValueMap) {
        for (const paramCode in params) if (params.hasOwnProperty(paramCode)) {
            const paramValue = params[paramCode];
            this.supplyResult(paramCode, paramValue);
        }
    }

    public isFinished() {
        return this.runStatus.tasksReady.length === 0;
    }

    protected startReadyTasks() {

        const readyTasks = this.runStatus.tasksReady;
        this.runStatus.tasksReady = [];

        for (let i = 0; i < readyTasks.length; i++) {
            const task = readyTasks[i];

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

        for (let i = 0; i < taskProvisions.length; i++) {
            const resultName = taskProvisions[i];
            const result = taskResults[resultName];

            this.supplyResult(resultName, result);
        }

        this.printStatus();

        this.startReadyTasks();
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
    }

    public printStatus() {
        // Uncomment to debug
        // console.log('▣ Run status:', this.runStatus);
    }
}

export interface FlowRunStatus {

    tasksReady: Task[];

    tasksByReq: {
        [req: string]: TaskMap,
    };
}

export interface GenericValueMap {
    [key: string]: any;
}
