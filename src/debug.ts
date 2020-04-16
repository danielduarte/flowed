import debug from 'debug';

const debugs: { [key: string]: any } = {};

export default (scope: string) => {
  let d = debugs[scope];

  if (typeof d === 'undefined') {
    d = debug(`flowed:${scope}`);
    debugs[scope] = d;
  }

  return d;
};
