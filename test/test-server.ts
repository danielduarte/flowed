import { debug as rawDebug } from 'debug';
import * as fs from 'fs';
import * as http from 'http';
const debug = rawDebug('flowed:test');

export default function createTestServer(responseContentType: string = 'application/json') {
  let serverClosing = false;

  const testServer = http.createServer((request, response) => {
    const { url } = request;

    debug(`Requested URL'${url}'. ${serverClosing ? 'Server is terminating' : ''}`);
    if (serverClosing) {
      response.end();
      return;
    }
    serverClosing = true;

    request.on('data', chunk => {});

    request.on('error', error => {
      debug(error);
    });

    request.on('end', () => {
      const filepath = 'test/examples/example6.flowed.json';

      fs.readFile(filepath, (error, data) => {
        if (error) {
          response.write(`Error reading file '${filepath}'`);
          response.end();

          testServer.close(() => {
            debug('Server terminated after failed request.');
          });

          return;
        }

        response.setHeader('Content-Type', responseContentType);
        response.write(data);
        response.end();

        testServer.close(() => {
          debug('Server terminated after successful request.');
        });
      });
    });
  });

  testServer.listen(3000);
}
