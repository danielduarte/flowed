# Design your flow

@todo explain use case

![Parallel Tasks](./tutorial.png)


# List your tasks

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

# Specify dependencies

```JavaScript
{
  tasks: {
    GetSessionInfo: {
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

# Give code to run

Every task needs to have a "resolver" associated. The resolver is basically the code to be executed in order to fulfill whatever the task does.
So for now, we'll just give a name for every resolver.

```JavaScript
{
  tasks: {
    GetSessionInfo: {
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


# Connect with the outsite

To make this thing really useful, we need a way to connect with the outside of the flow.
Even when a flow can execute useful tasks without giving a explicit output (writing to databases, etc), it is very usual to get some direct output from the flow.

We can accomplish that simply giving an array of the expected results.
For example, in this case we want to know if the user is authorized, which is the edge 'isAuthorized' in the flow.
We will run the flow then, indicating that the expected results are `['isAuthorized']`.

In a similar way, it is very important for flexibility and reusability purposes to provide some way of parametrization for the flows.
Analyzing the flow in this example, we can easily see that no task is providing 'ip' and 'userId'. This is because they will be provided from the outside, at the time of the execution.
That is, they are the flow parameters.
In this case, we'll provide them as a mapping name-value, like this:

```JavaScript
{
  ip: '203.52.180.31',
  userId: 27354,
}
```

Ok, we have almost all pieces to run a flow.

@todo implement resolvers

@todo run the flow
