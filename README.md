<p align="center"><a href="https://danielduarte.github.io/flowed/"><img width="445" height="100" src="./doc/flowed-logo.svg" alt="Flowed Logo"></a></p>
<p align="center">A fast and reliable flow engine for orchestration and more uses in <em>Node.js</em>, <em>Deno</em> and the browser.</p>
<p align="center">
    <a href="https://github.com/danielduarte/flowed/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/flowed?color=%23007ec6" alt="License"></a>
    <a href="https://www.npmjs.com/package/flowed"><img src="https://img.shields.io/npm/v/flowed" alt="NPM Package Version"></a>
    <a href="https://travis-ci.org/danielduarte/flowed"><img src="https://travis-ci.org/danielduarte/flowed.svg?branch=master" alt="Build Status"></a>
    <a href="https://app.fossa.com/attribution/e587cd9b-f7f8-4fa6-88b1-f81832d9ce07"><img src="https://app.fossa.com/api/projects/custom%2B13599%2Fgithub.com%2Fdanielduarte%2Fflowed.svg?type=shield" alt="FOSSA Status"></a>
    <a href="https://coveralls.io/github/danielduarte/flowed?branch=master"><img src="https://coveralls.io/repos/github/danielduarte/flowed/badge.svg?branch=master" alt="Coverage Status"></a>
    <a href="https://sonarcloud.io/dashboard?id=danielduarte_flowed"><img src="https://sonarcloud.io/api/project_badges/measure?project=danielduarte_flowed&metric=alert_status" alt="Quality Gate Status"></a>
</p>


## Installation

```
npm i flowed
```

## Browser

**From public CDN**

```HTML
<script src="https://cdn.jsdelivr.net/npm/flowed@latest/dist/lib/flowed.js" charset="utf-8"></script>
```

Or change `latest` in the URL for any available version.

**From package**

```HTML
<script src="./dist/lib/flowed.js" charset="utf-8"></script>
```

## Getting Started

- [Tutorial](./doc/tutorial.md)
- [Code examples](https://github.com/danielduarte/flowed/tree/master/test/examples)


## Main Features

- [Parallel execution](#parallel-execution)
- [Dependency management](#dependency-management)
- [Asynchronous and synchronous tasks](#asynchronous-and-synchronous-tasks)
- [JSON based flows](#json-based-flow-specifications)
- [Parametrized running](#parametrized-running)
- [Scoped visibility for tasks](#scoped-visibility-for-tasks)
- [Run flows from string, object, file or URL](#run-flows-from-string-object-file-or-url)
- [Pause/Resume and Stop/Reset functions](#pauseresume-and-stopreset-functions)
- [Inline parameters transformation](#inline-parameters-transformation)
- [Cyclic flows](#cyclic-flows)
- [Library with reusable frequently used tasks](#library-with-reusable-frequently-used-tasks)
- [Plugin system](#plugin-system)
- [Debugging](#debugging)


### Parallel execution

In order to run tasks in parallel, you don't have to do anything.
Simply adding them to a flow, they will run in parallel, of course if they don't have dependence on each other.


![Parallel Tasks](./doc/example-parallel.png)

```JavaScript
const flow = {
  tasks: {
    A: {
      provides: ['resultA'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
    B: {
      provides: ['resultB'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
    C: {
      requires: ['resultA', 'resultB'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
  },
}
```

```JavaScript
FlowManager.run(flow);
```


### Dependency management

Only specifying dependent inputs and outputs the flow manages dependencies automatically, executing in the correct order,
maximizing parallelism, and at the same time waiting for expected results when required.
Note that you can specify dependence between tasks arbitrarily, not only when one of them needs results from the other.

![Dependent Tasks](./doc/example-dependent.png)

```JavaScript
const flow = {
  tasks: {
    A: {
      provides: ['resultA'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
    B: {
      requires: ['resultA'],
      provides: ['resultB'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
    C: {
      requires: ['resultB'],
      resolver: {
        name: 'flowed::Noop',
      },
    },
  },
}
```

```JavaScript
FlowManager.run(flow);
```


### Asynchronous and synchronous tasks

Each task in a flow is associated to a "resolver", which is the piece of code that runs when the task executes.
So, resolvers resolve the goals of tasks.
Well, those resolvers can be synchronous (simply returning its results) or asynchronous (returning a promise).
The flow will take care of promises, waiting for results according to dependencies. 


### JSON based flow specifications

The flow specifications are written in JSON format, which means:
- They are easily serialized/unserialized for storage and transmission.
- They are developer and IDE friendly, very easy to read and understand.
- They are easily or actually directly transformable from and to JavaScript objects.
- They are actually supported for most modern programming languages.
- They are API friendly.

Or in a few words, JSON specs means saving a lot of time and headaches.


### Parametrized running

The same flow can be ran many times with different parameters provided from outside.
Parameters can satisfy requirements for tasks that expect for them, in the same way they can be provided as
output of another task.
That also means, if you already have pre-calculated results, you can provide them to the flow and accelerate its execution.


### Scoped visibility for tasks

All tasks in a flow, even the ones that have the same resolver, have a private space of names for parameters and results.
That means:
- When developing a new resolver, the developer don't have take care of name collisions.
- Resolvers are always reusable between flows.

But, what happends with resourses that I want to share all through the flow?
Loggers, connections, application references, whatever.
In that case, you can use a "context" that's also available in all the flow tasks.
All resources in the contexts are shared.


### Run flows from string, object, file or URL

Flow can be ran from a specification provided from a JSON string, a JavaScript object,
a JSON file or an accessible URL that serves the spec in JSON.


### Pause/Resume and Stop/Reset functions

Flow executions can be paused and resumed with task granularity.
The same for stopping and resetting, that last being to set the flow up to start from the beginning. 


### Inline parameters transformation

Task parameters can be transformed before running each task using an inline template.

In this example, given the current date `new Date()`, a simple flow is used to get a plane JavaScript object with day, month and year.

The template embedded in the flow is:

<!--- {% raw %} -->
```JavaScript
{
  day: '{{date.getDate()}}',
  month: '{{date.getMonth() + 1}}',
  year: '{{date.getFullYear()}}'
}
```
<!--- {% endraw %} -->

Where `date` is known by the template because it is in the `requires` list of the task `convertToObj`.

<!--- {% raw %} -->
```JavaScript
const flow = {
  tasks: {
    getDate: {
      provides: ['date'],
      resolver: {
        name: 'flowed::Echo',
        params: { in: { value: new Date() } },
        results: { out: 'date' },
      }
    },
    convertToObj: {
      requires: ['date'],
      provides: ['result'],
      resolver: {
        name: 'flowed::Echo',
        params: {
          in: {
            transform: {
              day: '{{date.getDate()}}',
              month: '{{date.getMonth() + 1}}',
              year: '{{date.getFullYear()}}',
            }
          }
        },
        results: { out: 'result' },
      }
    }
  },
};
```
<!--- {% endraw %} -->

```JavaScript
FlowManager.run(flow, {}, ['result']);
```

The result got today (01/03/2020) is `{ day: 3, month: 1, year: 2020 }`.

In order to use the benefits of the template transformation I highly recommend to take a look at [the ST documentation](https://selecttransform.github.io/site/transform.html) and check the features and examples. 
Also play with [this tool](https://selecttransform.github.io/playground) provided by [ST](https://selecttransform.github.io/site), and design your templates dynamically.


### Cyclic flows

Flows can have cyclic dependencies forming loops.
In order to run these flows, external parameters must raise the first execution.

Timer example:

This resolver will check a context value to know if the clock must continue ticking or not.

Also the current tick number is output to the console.

```JavaScript
class Print {
  exec({ message }, context) {
    return new Promise((resolve, reject) => {

      let stop = false;
      context.counter++;
      if (context.counter === context.limit) {
        stop = true;
      }

      setTimeout(() => {
        console.log(message, context.counter);
        resolve(stop ? {} : { continue: true });
      }, 1000);
    });
  }
}
```

And the flow execution:

```JavaScript
flowed.FlowManager.run({
    tasks: {
      tick: {
        requires: ['continue'],
        provides: ['continue'],
        resolver: {
          name: 'Print',
          params: { message: { value: 'Tick' } },
          results: { continue: 'continue' },
        }
      },
    },
  }, { continue: true }, [], { Print }, { counter: 0, limit: 5 },
);
```

The expected console output is:

```
Tick 1
Tick 2
Tick 3
Tick 4
Tick 5
```

Note that the task requires and provides the same value `continue`.

In order to solve the cyclic dependency and start running the flow, the first value for `continue` is provided in the parameters `{ continue: true }`. Otherwise, the flow would never start.

The dependency loops can be formed by any number of tasks, not only by the same as in this simple example.


### Library with reusable frequently used tasks

For several common tasks, resolvers are provided in the bundle, so you don't have to worry about programming the same thing over and over again.
You just have to take care of your custom code.

For more information, please check the [Built-In resolver library documentation](./doc/resolver-library.md)

Or go directly to  the desired resolver details:

- [Noop](./doc/resolver-library.md#noop)
- [Echo](./doc/resolver-library.md#echo)
- [ThrowError](./doc/resolver-library.md#throwerror)
- [Conditional](./doc/resolver-library.md#conditional)
- [Wait](./doc/resolver-library.md#wait)
- [SubFlow](./doc/resolver-library.md#subflow)
- [Repeater](./doc/resolver-library.md#repeater)
- [ArrayMap](./doc/resolver-library.md#arraymap)
- [Stop](./doc/resolver-library.md#stop)
- [Pause](./doc/resolver-library.md#pause)


### Plugin system

Using the Flowed plugin system, any developer can add their own resolver library and easily integrate it into the flow engine.

Custom resolver libraries can even be published and distributed as independent NPM packages.


### Debugging

(debugging doc coming soon...)
