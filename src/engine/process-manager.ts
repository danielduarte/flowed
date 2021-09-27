import { Debugger } from 'debug';
import { LoggerFn, TaskResolverExecutor, ValueMap } from '../types';
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
    taskResolverExecutor: TaskResolverExecutor,
    context: ValueMap,
    automapParams: boolean,
    automapResults: boolean,
    flowId: number,
    debug: Debugger,
    log: LoggerFn,
  ): TaskProcess {
    this.nextProcessId++;
    const process = new TaskProcess(this, this.nextProcessId, task, taskResolverExecutor, context, automapParams, automapResults, flowId, debug, log);
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
