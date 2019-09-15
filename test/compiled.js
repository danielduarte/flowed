'use strict';

module.exports = function runCompiledFlow(params, expectedResults) {

  const promiseFns = {
  };

  const result = new Promise((resolve, reject) => {
    promiseFns.resolve = resolve;
    promiseFns.reject = reject;
  });

  const results = {};
  
  function removeFromArray(array, item) {
    const index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  
  const pending_E = ['v4', 'v5'];
  const pending_F = ['v6', 'v7'];
  
  function finished_A(results) {
    if (results.hasOwnProperty('v2')) {
      exec(B).then(results => {
        finished_B(results);
      });
      exec(C).then(results => {
        finished_C(results);
      });
    }
    if (results.hasOwnProperty('v3')) {
      exec(D).then(results => {
        finished_D(results);
      });
    }
  }
  
  function finished_B(results) {
    if (results.hasOwnProperty('v4')) {
      removeFromArray(pending_E, 'v4');
      if (pending_E.length === 0) {
        exec(E).then(results => {
          finished_E(results);
        });
      }
    }
  }
  
  function finished_C(results) {
    if (results.hasOwnProperty('v5')) {
      removeFromArray(pending_E, 'v5');
      if (pending_E.length === 0) {
        exec(E).then(results => {
          finished_E(results);
        });
      }
    }
  }
  
  function finished_D(results) {
    if (results.hasOwnProperty('v7')) {
      removeFromArray(pending_F, 'v7');
      if (pending_F.length === 0) {
        exec(F).then(results => {
          finished_F(results);
        });
      }
    }
  }
  
  function finished_E(results) {
    if (results.hasOwnProperty('v6')) {
      removeFromArray(pending_F, 'v6');
      if (pending_F.length === 0) {
        exec(F).then(results => {
          finished_F(results);
        });
      }
    }
  }
  
  if (params.hasOwnProperty('v1')) {
    exec(A).then(results => {
      finished_A(results);
    });
  }
  
  if (params.hasOwnProperty('v2')) {
    exec(B).then(results => {
      finished_B(results);
    });
    exec(C).then(results => {
      finished_C(results);
    });
  }
  
  if (params.hasOwnProperty('v3')) {
    exec(D).then(results => {
      finished_D(results);
    });
  }
  
  if (params.hasOwnProperty('v4')) {
    removeFromArray(pending_E, 'v4');
    if (pending_E.length === 0) {
      exec(E).then(results => {
        finished_E(results);
      });
    }
  }
  
  if (params.hasOwnProperty('v5')) {
    removeFromArray(pending_E, 'v5');
    if (pending_E.length === 0) {
      exec(E).then(results => {
        finished_E(results);
      });
    }
  }
  
  if (params.hasOwnProperty('v6')) {
    removeFromArray(pending_F, 'v6');
    if (pending_F.length === 0) {
      exec(F).then(results => {
        finished_F(results);
      });
    }
  }
  
  if (params.hasOwnProperty('v7')) {
    removeFromArray(pending_F, 'v7');
    if (pending_F.length === 0) {
      exec(F).then(results => {
        finished_F(results);
      });
    }
  }

  return result;
};
