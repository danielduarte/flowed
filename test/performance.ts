// @todo create performance test suite and remove this one

// import rawDebug from '../src/debug';
// import * as Examples from './examples/index';
// const debug = rawDebug('test');
//
// const times = 100000;
// const maxTime = '2s'; // @todo Put back to 2s when created performance test suite
//
// describe('a simple flow with 7 tasks', function() {
//   this.timeout(maxTime);
//
//   it(`runs ${times} times in less than ${maxTime} ms`, async () => {
//     const start = Date.now();
//
//     for (let i = 0; i < times; i++) {
//       await Examples.example2();
//     }
//
//     debug(`Ran flow ${times} times in ${Date.now() - start} ms`);
//   });
// });
