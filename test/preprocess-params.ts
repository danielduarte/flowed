import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

class GetName {
  public async exec(): Promise<ValueMap> {
    return { name: 'Daniel Duarte' };
  }
}

class GetAge {
  public async exec(): Promise<ValueMap> {
    return { age: 38 };
  }
}

class GetCity {
  public async exec(): Promise<ValueMap> {
    return { city: 'Tandil' };
  }
}

class Echo {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return { out: params.in };
  }
}

describe('resolvers with params pre-processor', () => {
  it('pre-process properly', async () => {
    const result = (
      await FlowManager.run(
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
                    // @todo Add test to combine 'transform' with 'value'
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
          options: {
            resolverAutomapResults: true,
          },
        },
        {},
        ['out'],
        { GetName, GetAge, GetCity, Echo },
      )
    ).out;

    expect(result).to.be.eql({ nombre: 'Daniel Duarte', edad: 38, ciudad: 'Tandil' });
  });
});
