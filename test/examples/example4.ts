import { FlowManager } from '../../src/engine/flow-manager';
import { Task } from '../../src/engine/task';
import { GenericValueMap } from '../../src/types';
import { ExampleFunction } from './types';

class CallMicroservice {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    let response;
    if (params.url === 'http://product') {
      response = {
        sku: params.sku,
        name: 'Caneta',
        description: 'A belha caneta para a escola.',
      };
    } else {
      response = {
        currency: 'BRL',
        value: 3.99,
      };
    }

    return {
      response,
    };
  }
}

class SimpleMerge {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return {
      result: Object.assign({}, params.obj1, params.obj2),
    };
  }
}

export const example4: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        getProdInfo: {
          requires: ['urlProdInfo', 'sku'],
          provides: ['prod-info'],
          resolver: {
            name: 'callMicroservice',
            params: { url: 'urlProdInfo', sku: 'sku' },
            results: { response: 'prod-info' },
          },
        },
        getPriceInfo: {
          requires: ['urlPriceInfo', 'sku'],
          provides: ['price-info'],
          resolver: {
            name: 'callMicroservice',
            params: { url: 'urlPriceInfo', sku: 'sku' },
            results: { response: 'price-info' },
          },
        },
        merge: {
          requires: ['prod-info', 'price-info'],
          provides: ['product'],
          resolver: {
            name: 'simpleMerge',
            params: { obj1: 'prod-info', obj2: 'price-info' },
            results: { result: 'product' },
          },
        },
      },
    },
    {
      sku: 'abc123',
      urlProdInfo: 'http://product',
      urlPriceInfo: 'http://price',
    },
    ['product'],
    {
      callMicroservice: CallMicroservice,
      simpleMerge: SimpleMerge,
    },
  );
};
