import {Flow, GenericValueMap, TaskResolverMap} from './flow'
import {FlowSpec} from './flow-specs'


export class FlowManager {

    public static run(
        flowSpec: FlowSpec,
        params: GenericValueMap = {},
        expectedResults: string[] = [],
        resolvers: TaskResolverMap = {},
    ): Promise<GenericValueMap> {
        const flow = new Flow(flowSpec);
        return flow.run(params, expectedResults, resolvers);
    }
}
