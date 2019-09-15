import { FlowSpec, TaskSpecMap } from './engine';


export class FlowCompiler {

  // function exec(taskResolverConstructor, context) {
  //   const resolver = new taskResolverConstructor();
  //
  //   resolver.exec(params, context, this).then(
  //       resolverValue => {
  //         const results = this.mapResultsFromResolver(resolverValue);
  //
  //         this.runStatus.solvedResults = results;
  //
  //         resolve(this.runStatus.solvedResults);
  //       },
  //       (resolverError: Error) => {
  //         reject(resolverError);
  //       },
  //     );
  //   });
  // }

  public static o = '';

  public static compile(flowSpec: FlowSpec): void {
    // Prepare data structures
    const tasksByReq: { [key: string]: { [key: string]: string[] } } = {};
    let allReqs: string[] = [];

    const reqsByTask: { [key: string]: string[] } = {};
    for (const [taskCode, task] of Object.entries(flowSpec.tasks || {})) {
      reqsByTask[taskCode] = [...(task.requires || [])];
      allReqs = Array.from(new Set(allReqs.concat(task.requires || [])));
    }

    for (const [taskCode, task] of Object.entries(flowSpec.tasks || {})) {
      const taskReqs = task.requires || [];
      for (const req of taskReqs) {
        if (!tasksByReq.hasOwnProperty(req)) {
          tasksByReq[req] = {};
        }
        tasksByReq[req][taskCode] = reqsByTask[taskCode];
      }
    }
    // End: Prepare data structures

    this.starting();
    this.initializations();
    this.pendingArrays(flowSpec.tasks || {});
    this.finishTaskFunctions(flowSpec.tasks || {}, tasksByReq);
    this.initialExecution(tasksByReq, allReqs);
    this.ending();
  }

  protected static out(line: string) {
    this.o += `${line}\n`;
  }

  protected static w(code: any, indentLevel: number = 0, startingNewLine = false, endingNewLine = false) {
    if (typeof code === 'string') {

      const indent = '  '.repeat(indentLevel);
      this.out(`${startingNewLine ? '\n' : ''}${indent}${code.replace(/\n/g, `\n${indent}`)}${endingNewLine ? '\n' : ''}`);

    } else {

      if (startingNewLine) {
        code.unshift('');
      }
      if (endingNewLine) {
        code.push('');
      }
      for (const chunk of code) {
        this.w(chunk, indentLevel + 1, false, false);
      }

    }
  }

  protected static arrayToCodeBlock(codeLines: string[], indentLevel: number = 1, stargingNewLine: boolean = true, endingNewLine: boolean = true): string {
    const indent = '  ';
    const fullIndent = indent.repeat(indentLevel);
    if (codeLines.length === 0) { return ''; }
    return `${stargingNewLine ? '\n' : ''}${fullIndent}${codeLines.join('\n').replace(/\n/g, `\n${fullIndent}`)}${endingNewLine ? '\n' : ''}`;
  }
  protected static starting() {
    this.w([
      `'use strict';\n`,
      `module.exports = function runCompiledFlow(params, expectedResults) {`,
    ], -1);
  }

  protected static initializations() {
    this.w([
      `const results = {};\n`,
      'function removeFromArray(array, item) {',
      '  const index = array.indexOf(item);',
      '  if (index !== -1) {',
      '    array.splice(index, 1);',
      '  }',
      '}',
    ]);
  }

  protected static pendingArrays(tasks: TaskSpecMap) {
    const out = [];

    // Prepare arrays of pending requirements
    for (const [taskCode, task] of Object.entries(tasks)) {
      if ((task.requires || []).length > 1) {
        out.push(`const pending_${taskCode} = ['${(task.requires || []).join('\', \'')}'];`);
      }
    }

    this.w(out, 0, true);
  }

  protected static finishTaskFunctions(tasks: TaskSpecMap, tasksByReq: { [key: string]: { [key: string]: string[] } }) {
    // Prepare functions for tasks finished
    for (const [taskCode, task] of Object.entries(tasks)) {

      const fnBody = [];

      for (const result of task.provides || []) {
        if (tasksByReq.hasOwnProperty(result)) {
          const providedTasks = tasksByReq[result];
          const ifBody = [];
          for (const [provTaskCode, provTask] of Object.entries(providedTasks)) {

            const execLine = [`exec(${provTaskCode}).then(results => {`, [`finished_${provTaskCode}(results);`], '});'];
            if (provTask.length === 1) {
              ifBody.push(...execLine);
            } else {
              ifBody.push(`removeFromArray(pending_${provTaskCode}, '${result}');`);
              ifBody.push(`if (pending_${provTaskCode}.length === 0) {`, execLine, '}');
            }

          }

          fnBody.push(`if (results.hasOwnProperty('${result}')) {`, ifBody, '}');
        }
      }

      if (fnBody.length > 0) {
        this.w([`function finished_${taskCode}(results) {`, fnBody, '}'], 0, true);
      }
    }
  }

  protected static initialExecution(tasksByReq: { [key: string]: { [key: string]: string[] } }, allReqs: string[]) {
    const initialExec = [];
    for (const result of allReqs) {
      const providedTasks = tasksByReq[result];
      const ifBody = [];
      for (const [provTaskCode, provTask] of Object.entries(providedTasks)) {

        const execLine = [`exec(${provTaskCode}).then(results => {`, [`finished_${provTaskCode}(results);`], '});'];
        if (provTask.length === 1) {
          ifBody.push(...execLine);
        } else {
          ifBody.push(`removeFromArray(pending_${provTaskCode}, '${result}');`);
          ifBody.push(`if (pending_${provTaskCode}.length === 0) {`, execLine, '}');
        }

      }

      initialExec.push(`\nif (params.hasOwnProperty('${result}')) {`, ifBody, '}');
    }
    if (allReqs.length > 0) {
      this.w(initialExec);
    }

    this.w('resolve(results);', 1, true);
  }

  protected static ending() {
    this.w([`}\n`], -1);
  }
}
