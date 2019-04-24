import {FlowManager, GenericValueMap, TaskResolverInterface} from './flow';

class CallService implements TaskResolverInterface {
    exec(params: GenericValueMap = {}): any {

        const result = params.connectionParams.url === 'http://products' ?
            { name: 'Cacerola', sku: 'ABC123' } :
            { value: 1088.99, currency: 'ARS' };

        return new Promise(function (resolve, reject) {
            setTimeout(() => {
                resolve(result);
            }, 4000);
        });
    }
}
class MergeJson implements TaskResolverInterface {
    exec(params: GenericValueMap = {}): any {
        return Object.assign({}, params.obj1, params.obj2);
    }
}

FlowManager.run({
        tasks: {
            getProductInfo: {
                requires: ['prodInfoConfig'],
                provides: 'prodInfo',
                resolver: {
                    name: 'CallService',
                    params: {
                        connectionParams: 'prodInfoConfig',
                    },
                },
            },
            getPriceInfo: {
                requires: ['priceInfoConfig'],
                provides: 'priceInfo',
                resolver: {
                    name: 'CallService',
                    params: {
                        connectionParams: 'priceInfoConfig',
                    },
                },
            },
            merge: {
                requires: ['prodInfo', 'priceInfo'],
                provides: 'result',
                resolver: {
                    name: 'MergeJson',
                    params: {
                        obj1: 'prodInfo',
                        obj2: 'priceInfo',
                    }
                },
            },
        },
        goal: 'result',
    },
    {
        prodInfoConfig: {
            url: 'http://products',
            port: 80,
        },
        priceInfoConfig: {
            url: 'http://price',
            port: 8080,
        }
    },
    [CallService, MergeJson]
);
