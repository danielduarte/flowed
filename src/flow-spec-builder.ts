// import { FlowSpec, TaskSpec } from './engine/flow-specs';
//
// export class FlowSpecBuilder {
//
//   protected prefixes = {
//     task: '_T',
//     edge: '_E',
//   };
//
//   protected spec: FlowSpec = { tasks: {} };
//
//   protected nextTaskNum: number = 1;
//
//   public reset() {
//     this.spec = { tasks: {} };
//     this.nextTaskNum = 1;
//     return this;
//   }
//
//   public do(tasks: TaskSpec | TaskSpec[], name?: string | string[]) {
//
//     tasks = Array.isArray(tasks) ? tasks : [tasks];
//
//     agregar las tasks
//     this.addTask(name || this.generateTaskName(), taskSpec);
//
//     return this;
//   }
//
//   public then(tasks: TaskSpec | TaskSpec[], name?: string | string[]) {
//     const finalTaskNames: string[] = this.getFinalTaskNames();
//     const newTaskName = name || this.generateTaskName();
//     this.addTask(newTaskName, taskSpec);
//     for (let i = 0; i < finalTaskNames.length; i++) {
//       const finalTaskName = finalTaskNames[i];
//       this.addEdge(finalTaskName, newTaskName);
//     }
//
//     return this;
//   }
//
//   public parallel(tasks: TaskSpec[]) {
//     return this;
//   }
//
//   public finish() {
//     return this.spec;
//   }
//
//   protected getFinalTaskNames() {
//     // @todo implement
//     return [];
//   }
//
//   protected addTask(taskName: string, taskSpec: TaskSpec) {
//     this.spec.tasks[taskName] = taskSpec;
//   }
//
//   protected addEdge(fromTask: string, toTask: string) {
//     // @todo implement
//
//   }
//
//   protected generateTaskName() {
//     return this.prefixes.task + this.nextTaskNum++;
//   }
// }
//
//
// const flowBuilder = new FlowSpecBuilder();
//
// const flowSpec = flowBuilder
//   .do({})
//   .then(anotherTask)
//   .then([parallelTask1, parallelTask2])
//   .then(finalTask)
//   .finish();
