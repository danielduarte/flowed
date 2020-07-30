import { TaskResolverClass, ValueMap } from '../types';
import { Task } from './task';
import { TaskProcess } from './task-process';
import { Debugger } from 'debug';

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
    context: ValueMap,
    automapParams: boolean,
    automapResults: boolean,
    flowId: number,
    debug: Debugger,
  ): TaskProcess {
    this.nextProcessId++;
    const process = new TaskProcess(this, this.nextProcessId, task, taskResolverConstructor, context, automapParams, automapResults, flowId, debug);
    this.processes.push(process);

    return process;
  }

  public runningCount(): number {
    return this.processes.length;
  }

  public removeProcess(process: TaskProcess): void {
    const processIndex = this.processes.findIndex(p => p.id === process.id);
    this.processes.splice(processIndex, 1);
  }
}
