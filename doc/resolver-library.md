# Flowed Built-In resolver library

## Resolvers

- [Noop](#noop)
- [Echo](#echo)
- [ThrowError](#throwerror)
- [Conditional](#conditional)
- [Wait](#wait)
- [SubFlow](#subflow)
- [Repeater](#repeater)
- [ArrayMap](#arraymap)
- [Stop](#stop)
- [Pause](#pause)

[◂ Back](../README.md)

### Noop

Does nothing.

> Useful to set tasks dependencies without executing anything.

**name**: `flowed::Noop`

**params**: _None_

**results**: _None_

---

### Echo

Returns the input value or its transformation as the result.

> Useful to apply transformations of multiple parameters into others, without executing any specific task.

**name**: `flowed::Echo`

**params**:
- `in`: The input value.

**results**:
- `out`: Echo of the input value. Unless transformed, it will be the same value provided in the param `in`.

---

### ThrowError

Throws an error with a specified message.

> Useful to stop a flow execution with a specific error, under a given condition.

**name**: `flowed::ThrowError`

**params**:
- `message`: The message for the error to be thrown.

**results**: _None_

---

### Conditional

Provides one of two possible results depending of a given condition.

> Useful to run different parts of a flow, depending on conditions calculated for other tasks or passed as parameters.

**name**: `flowed::Conditional`

**params**:
- `condition`: The expression to be evaluated as boolean. If truthy, the `trueResult` is provided, otherwise `falseResult` is provided.
- `trueResult`: The value to be provided when `condition` is truthy. When this value is provided, `falseResult` is not.
- `falseResult`: The value to be provided when `condition` is falsy. When this value is provided, `trueResult` is not.

**results**:
- `onTrue`: The result to be provided when `condition` is truthy. It would have the value given in the parameter `trueResult`.
- `onFalse`: The result to be provided when `condition` is falsy. It would have the value given in the parameter `falseResult`.

---

### Wait

Waits for `ms` milliseconds and finish returning the specified `result`.

> Useful to implement timeouts and timers.

**name**: `flowed::Wait`

**params**:
- `ms`: Milliseconds to time out.
- `result`: Value to be returned on time out.

**results**:
- `result`: The specified value in `result` parameter.

---

### SubFlow

Runs a flow using the specification and arguments provided as parameter.

Note that the context is not passed as parameter because it is shared from the outside flow.

> Useful to enclose a sub-flow execution with a flow spec given as entry.

**name**: `flowed::SubFlow`

**params**:
- `flowSpec`: Flow spec to be run as a sub-flow.
- `flowParams`: Key-Value object to be used as parameters for the sub-flow.
- `flowExpectedResults`: String array to specify the expected results.
- `flowResolvers`: Resolvers map to run the sub-flow.

**results**:
- `flowResult`: Key-Value object with the sub-flow execution results.

---

### Repeater

Runs a task multiple times and finishes returning an array with all results.

If one execution fails, the resolver ends with an exception (in both parallel and not parallel modes).

> Useful to repeat the same task a number of times, in a for-loop like way.

**name**: `flowed::Repeater`

**params**:
- `resolver`: Resolver to run the task.
- `taskSpec`: Task spec.
- `count`: Number of times the task is going to be executed.
- `taskParams`: Array of Key-Value objects with params.
- `resolverAutomapParams`: Boolean to indicate if params in task are going to be auto-mapped or need explicit mapping. Defaults to false.
- `resolverAutomapResults`: Boolean to indicate if results in task are going to be auto-mapped or need explicit mapping. Defaults to false.
- `flowId`: Flow id to be used in debugging messages.
- `parallel`: Boolean to specify if the task instances can run in parallel or in sequence (waiting one to finish before starting the next one).

**results**:
- `results`: Array of Key-Value objects with results of all executions.

---

### ArrayMap

Runs a task multiple times taking an array of parameter groups.
For each parameter group in the array, the task is run once, collecting the results in the same order in the `results` array.
The task instances can be run in parallel or in sequence. In both cases the order in the results will be the same as the corresponding in the `params` parameter.

> Useful to implement the Array.prototype.map() logic in a flow.

**name**: `flowed::ArrayMap`

**params**:
- `resolver`: Resolver to run the task.
- `spec`: Task spec.
- `params`: Array of Key-Value objects with params.
- `automapParams`: Boolean to indicate if params in task are going to be auto-mapped or need explicit mapping. Defaults to false.
- `automapResults`: Boolean to indicate if results in task are going to be auto-mapped or need explicit mapping. Defaults to false.
- `flowId`: Flow id to be used in debugging messages.
- `parallel`: Boolean to specify if the task instances can run in parallel or in sequence (waiting one to finish before starting the next one).

**results**:
- `results`: Array of Key-Value objects with results of all executions in the corresponding order of `params` parameter.

---

### Stop

Initiates the stop operation of the flow.
When the returned promise is resolved, the flow has been stopped.

> Useful to stop a running flow without error, under certain conditions.

**name**: `flowed::Stop`

**params**: _None_

**results**:
- `promise`: The promise to wait for the flow to finish the stop operation.

---

### Pause

Initiates the pause operation of the flow.
When the returned promise is resolved, the flow has been paused.
A paused flow can be resumed later.

> Useful to pause a running flow under certain conditions.

**name**: `flowed::Pause`

**params**: _None_

**results**:
- `promise`: The promise to wait for the flow to finish the pause operation.
