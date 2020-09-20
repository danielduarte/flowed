import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

describe('resolver loop', () => {
  const products = [
    { id: 1, name: 'prod 1', sku: 'p1' },
    { id: 2, name: 'prod 2', sku: 'p2' },
    { id: 3, name: 'prod 3', sku: 'p3' },
    { id: 4, name: 'prod 4', sku: 'p4' },
  ];

  const prices = [
    { id: 1, value: 111 },
    { id: 2, value: 222 },
    { id: 3, value: 333 },
    { id: 4, value: 444 },
  ];

  const productsWithPrice = [
    { id: 1, name: 'prod 1', sku: 'p1', value: 111 },
    { id: 2, name: 'prod 2', sku: 'p2', value: 222 },
    { id: 3, name: 'prod 3', sku: 'p3', value: 333 },
    { id: 4, name: 'prod 4', sku: 'p4', value: 444 },
  ];

  class CallApiProd {
    exec(params: ValueMap) {
      return Promise.resolve({
        body: products[params.pathParams.id - 1],
      });
    }
  }

  class CallApiPrice {
    exec(params: ValueMap) {
      return Promise.resolve({
        body: prices[params.pathParams.id - 1],
      });
    }
  }

  it('run loop resolver with single subtask', async () => {
    const flow = {
      tasks: {
        subflow: {
          requires: ['productIds'],
          provides: ['products'],
          resolver: {
            name: 'flowed::Loop',
            params: {
              inCollection: 'productIds',
              inItemName: { value: 'prodId' },
              outItemName: { value: 'product' },
              subtask: {
                value: {
                  requires: ['prodId'],
                  provides: ['product'],
                  resolver: {
                    name: 'CallApiProd',
                    params: {
                      pathParams: { transform: { id: '{{prodId}}' } },
                      path: '/products/{id}',
                      method: 'get',
                      serverUrl: 'http://localhost:3003',
                    },
                    results: {
                      body: 'product',
                    },
                  },
                },
              },
            },
            results: {
              outCollection: 'products',
            },
          },
        },
      },
    };

    const result = await FlowManager.run(flow, { productIds: [1, 2, 3, 4] }, ['products'], { CallApiProd });

    expect(result).to.be.eql({ products });
  });

  it('run loop resolver with subflow', async () => {
    const flow = {
      tasks: {
        subflow: {
          requires: ['productIds'],
          provides: ['products'],
          resolver: {
            name: 'flowed::Loop',
            params: {
              inCollection: 'productIds',
              inItemName: { value: 'prodId' },
              outItemName: { value: 'innerResults' },
              subtask: {
                value: {
                  requires: ['prodId'],
                  provides: ['product'],
                  resolver: {
                    name: 'flowed::SubFlow',
                    params: {
                      flowSpec: {
                        value: {
                          tasks: {
                            getProdInfo: {
                              requires: ['prodId'],
                              provides: ['prodInfo'],
                              resolver: {
                                name: 'CallApiProd',
                                params: {
                                  pathParams: { transform: { id: '{{prodId}}' } },
                                  path: '/products/{id}',
                                  method: 'get',
                                  serverUrl: 'http://localhost:3003',
                                },
                                results: {
                                  body: 'prodInfo',
                                },
                              },
                            },
                            getProdPrice: {
                              requires: ['prodId'],
                              provides: ['prodPrice'],
                              resolver: {
                                name: 'CallApiPrice',
                                params: {
                                  pathParams: { transform: { id: '{{prodId}}' } },
                                  path: '/prices/{id}',
                                  method: 'get',
                                  serverUrl: 'http://localhost:3003',
                                },
                                results: {
                                  body: 'prodPrice',
                                },
                              },
                            },
                            merge: {
                              requires: ['prodInfo', 'prodPrice'],
                              provides: ['product'],
                              resolver: {
                                name: 'flowed::Echo',
                                params: {
                                  in: { transform: '{{ Object.assign({}, prodInfo, prodPrice) }}' },
                                },
                                results: {
                                  out: 'product',
                                },
                              },
                            },
                          },
                        },
                      },
                      flowParams: { transform: { prodId: '{{prodId}}' } },
                      flowExpectedResults: { value: ['product'] },
                      uniqueResult: { value: 'product' },
                    },
                    results: {
                      flowResult: 'innerResults',
                    },
                  },
                },
              },
            },
            results: {
              outCollection: 'products',
            },
          },
        },
      },
    };

    const result = await FlowManager.run(flow, { productIds: [1, 2, 3, 4] }, ['products'], { CallApiProd, CallApiPrice });

    expect(result).to.be.eql({ products: productsWithPrice });
  });
});
