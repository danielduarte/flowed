import { expect } from 'chai';
import { GenericValueMap, TaskResolver, TaskResolverMap } from '../src/engine/flow';
import { FlowManager } from '../src/engine/flow-manager';
import { FlowSpec } from '../src/engine/flow-specs';
import { Task } from '../src/engine/task';

class DummyResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return {};
  }
}

describe('FlowManager', () => {
  it('can run an empty flow', () => {
    const flowSpec: FlowSpec  = {
      tasks: {
      },
    };

    return FlowManager.run(flowSpec);
  });

  it('can run a simple flow', () => {
    const flowSpec: FlowSpec  = {
      tasks: {
        sampleTask: {
          requires: [],
          provides: [],
          resolver: {
            name: 'sampleResolver',
            params: [],
            results: [],
          },
        },
      },
    };

    const resolvers: TaskResolverMap = {
      sampleResolver: DummyResolver,
    };

    return FlowManager.run(flowSpec, {}, [], resolvers)
  });
});

// @todo test: cannot run flow with undefined resolver