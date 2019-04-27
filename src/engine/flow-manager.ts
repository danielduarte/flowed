import {FlowSpec} from './flow-specs'
import {Flow, GenericValueMap, TaskResolverMap} from './flow'


export class FlowManager {

    static run(
        flowSpec: FlowSpec,
        params: GenericValueMap = {},
        expectedResults: string[] = [],
        resolvers: TaskResolverMap = {},
    ): Promise<GenericValueMap> {
        const flow = new Flow(flowSpec);
        return flow.run(params, expectedResults, resolvers);
    }
}
