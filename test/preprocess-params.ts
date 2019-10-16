import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

class GetName {
  public async exec(): Promise<GenericValueMap> {
    return { name: 'Daniel Duarte' };
  }
}

class GetAge {
  public async exec(): Promise<GenericValueMap> {
    return { age: 38 };
  }
}

class GetCity {
  public async exec(): Promise<GenericValueMap> {
    return { city: 'Tandil' };
  }
}

class Echo {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return { out: params.in };
  }
}

describe('resolvers with params pre-processor', () => {
  it('pre-process properly', async () => {
    const result = (await FlowManager.run(
      {
        tasks: {
          name: {
            provides: ['name'],
            resolver: { name: 'GetName' },
          },
          age: {
            provides: ['age'],
            resolver: { name: 'GetAge' },
          },
          city: {
            provides: ['city'],
            resolver: { name: 'GetCity' },
          },
          spanishEcho: {
            requires: ['name', 'age', 'city'],
            provides: ['out'],
            resolver: {
              name: 'Echo',
              params: {
                in: {
                  // @todo Add test to conbine 'transform' with 'value'
                  transform: {
                    nombre: '{{name}}',
                    edad: '{{age}}',
                    ciudad: '{{city}}',
                  },
                },
              },
            },
          },
        },
        configs: {
          resolverAutomapResults: true,
        },
      },
      {},
      ['out'],
      { GetName, GetAge, GetCity, Echo },
    )).out;

    expect(result).to.be.eql({ nombre: 'Daniel Duarte', edad: 38, ciudad: 'Tandil' });
  });
});
