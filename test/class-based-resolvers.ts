import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

describe('class-based resolvers', () => {
  class ClassBasedResolver {
    static classMethod(x: string) {
      return `value from static method: "${x}"`;
    }

    anInstanceMethod(x: string) {
      if (typeof this === 'undefined') {
        throw new Error('This method should have been attached to an object');
      }
      return `value from dynamic method: "${x}"`;
    }

    public async exec(params: ValueMap): Promise<ValueMap> {
      const value1 = ClassBasedResolver.classMethod(params.param1);
      const value2 = this.anInstanceMethod(params.param2);
      return { value1, value2 };
    }
  }

  it('class-based resolvers support instance methods', async () => {
    const results = await FlowManager.run(
      {
        tasks: {
          t: {
            requires: ['param1', 'param2'],
            provides: ['value1', 'value2'],
            resolver: { name: 'ClassBasedResolver' },
          },
        },
        options: {
          resolverAutomapParams: true,
          resolverAutomapResults: true,
        },
      },
      { param1: 'X', param2: 'Y' },
      ['value1', 'value2'],
      { ClassBasedResolver },
    );

    expect(results.value1).to.be.eql('value from static method: "X"');
    expect(results.value2).to.be.eql('value from dynamic method: "Y"');
  });
});
