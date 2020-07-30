import debug, { Debugger } from 'debug';

const debugs: { [key: string]: Debugger } = {};

export default (scope: string): Debugger => {
  let d = debugs[scope];

  if (typeof d === 'undefined') {
    d = debug(`flowed:${scope}`);
    debugs[scope] = d;
  }

  return d;
};
