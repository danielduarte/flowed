# Use Case

> A system needs to verify user locations to limit the access to certail features.
> Depending on the user location, she/he is authorized or not.


## Design your flow

![Parallel Tasks](./tutorial.png)


## List your tasks

```JavaScript
{
  tasks: {
    GetSessionInfo: {},
    GetGeoInfo: {},
    GetAuthorizedLocations: {},
    ValidateDistance: {},
    StoreEvent: {}
  }
}
```


## Specify dependencies

```JavaScript
{
  tasks: {
    GetSessionInfo: {
      requires: ['sessionId'],
      provides: ['ip', 'userId']
    },
    GetGeoInfo: {
      requires: ['ip'],
      provides: ['address']
    },
    GetAuthorizedLocations: {
      requires: ['userId'],
      provides: ['authorizedLocations']
    },
    ValidateDistance: {
      requires: ['address', 'authorizedLocations'],
      provides: ['isAuthorized']
    },
    StoreEvent: {
      provides: ['isAuthorized']
    }
  }
}
```


## Give code to run

Every task needs to have a "resolver" associated. The resolver is basically the code to be executed in order to fulfill whatever the task does.
So for now, we'll just give a name for every resolver.

```JavaScript
{
  tasks: {
    GetSessionInfo: {
      requires: ['sessionId'],
      provides: ['ip', 'userId'],
      resolver: { name: 'readSession' }
    },
    GetGeoInfo: {
      requires: ['ip'],
      provides: ['address'],
      resolver: { name: 'getGeo' }
    },
    GetAuthorizedLocations: {
      requires: ['userId'],
      provides: ['authorizedLocations'],
      resolver: { name: 'loadAuthLocations' }
    },
    ValidateDistance: {
      requires: ['address', 'authorizedLocations'],
      provides: ['isAuthorized'],
      resolver: { name: 'validateAccess' }
    },
    StoreEvent: {
      provides: ['isAuthorized'],
      resolver: { name: 'storeAccessEvent' }
    }
  }
}
```

And at the time of the execution of the flow, we need to prepare a class mapping.
This way we put a real class associated with every resolver name.

```JavaScript
{
  readSession: ReadUserSession,
  getGeo: GetGeoInformation,
  loadAuthLocations: LoadAuthLocations,
  validateAccess: ValidateLocationAccess,
  storeAccessEvent: StoreAccessEvent
}
```

Now it's time for you to do the developer job.
Implement the classes ReadUserSession, GetGeoInformation, LoadAuthLocations, ValidateLocationAccess and StoreAccessEvent with your business specific logic.
We'll come back to this later and see how to do it.
By the way, for common tasks there are some built-in resolvers provided in this package.


## Connect with the outsite

To make this thing really useful, we need a way to connect with the outside of the flow.
Even when a flow can execute useful tasks without giving a explicit output (writing to databases, etc), it is very usual to get some direct output from the flow.

We can accomplish that simply giving an array of the expected results.
For example, in this case we want to know if the user is authorized, which is the edge 'isAuthorized' in the flow.
We will run the flow then, indicating that the expected results are `['isAuthorized']`.


In a similar way, it is very important for flexibility and reusability purposes to provide some way of parametrization for the flows.
Analyzing the flow in this example, we can easily see that no task is providing the `'sessionId'`. This is because it will be given from the outside, at the time of the execution.
That is, it is a flow parameter.
We provide parameters as a name-value mapping like this:

```JavaScript
{
  sessionId: '98113fcc-a9aa-444a-9241-3b7694142605',
}
```

Ok, we have almost all pieces to run a flow.


## Write code

@todo explain this section

```JavaScript
class ReadUserSession {
  public exec(): Promise<GenericValueMap> {
    // Suppose a singleton Session class
    const userSession = Session.getInstance();
    return {
      ip: userSession.remmoteIp,
      userId: userSession.userId,
    };
  }
}
```

```JavaScript
class GetGeoInformation {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return {
      address: GeoInfoLibrary.getAddressByIp(params.ip),
    };
  }
}
```

@todo implement example class
```JavaScript
class LoadAuthLocations {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
  }
}
```

@todo implement example class
```JavaScript
class ValidateLocationAccess {
  public exec(params: GenericValueMap): Promise<GenericValueMap> {
  }
}
```

@todo implement example class
```JavaScript
class StoreAccessEvent {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
  }
}
```


## Map the resolver params and results

@todo explain resolvers mapping


## Run

```JavaScript
FlowManager.run(
  // The flow spec
  {
    tasks: {
      GetSessionInfo: {
        requires: ['sessionId'],
        provides: ['ip', 'userId'],
        resolver: { name: 'readSession' },
      },
      GetGeoInfo: {
        requires: ['ip'],
        provides: ['address'],
        resolver: { name: 'getGeo' },
      },
      GetAuthorizedLocations: {
        requires: ['userId'],
        provides: ['authorizedLocations'],
        resolver: { name: 'loadAuthLocations' },
      },
      ValidateDistance: {
        requires: ['address', 'authorizedLocations'],
        provides: ['isAuthorized'],
        resolver: { name: 'validateAccess' },
      },
      StoreEvent: {
        provides: ['isAuthorized'],
        resolver: { name: 'storeAccessEvent' },
      },
    },
  },

  // The parameters
  {
    sessionId: '98113fcc-a9aa-444a-9241-3b7694142605',
  },

  // The expected results
  [
    'isAuthorized'
  ],

  // The resolvers mapping
  {
    readSession: ReadUserSession,
    getGeo: GetGeoInformation,
    loadAuthLocations: LoadAuthLocations,
    validateAccess: ValidateLocationAccess,
    storeAccessEvent: StoreAccessEvent
  }
)
.then(results => {
  // Get the results when flow promise is solved
  console.log(results.isAuthrized ? 'User authorized!' : 'User not autorized :(');
})
.catch(error => {
  // In case of error, catch it here
  console.error(`There has been an error running the flow: ${error.message}`);
});
```
