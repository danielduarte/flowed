import { GenericValueMap, TaskResolverClass } from '../types';
import { Task } from './task';
import { TaskProcess } from './task-process';

export class ProcessManager {
  public nextProcessId: number;

  public processes: TaskProcess[];

  public constructor() {
    this.nextProcessId = 1;
    this.processes = [];
  }

  public createProcess(
    task: Task,
    taskResolverConstructor: TaskResolverClass,
    context: GenericValueMap,
    automapParams: boolean,
    automapResults: boolean,
    flowId: number,
  ) {
    this.nextProcessId++;
    const process = new TaskProcess(this, this.nextProcessId, task, taskResolverConstructor, context, automapParams, automapResults, flowId);
    this.processes.push(process);

    return process;
  }

  public runningCount() {
    return this.processes.length;
  }

  public removeProcess(process: TaskProcess) {
    const processIndex = this.processes.findIndex(p => p.id === process.id);
    this.processes.splice(processIndex, 1);
  }
}
