import rawDebug from '../src/debug';
import * as fs from 'fs';
import * as http from 'http';
const debug = rawDebug('test');

export default function createTestServer(responseContentType = 'application/json'): void {
  let serverClosing = false;

  const testServer = http.createServer((request, response) => {
    const { url } = request;

    debug(`Requested URL'${url}'. ${serverClosing ? 'Server is terminating' : ''}`);
    if (serverClosing) {
      response.end();
      return;
    }
    serverClosing = true;

    request.on('data', () => {});

    request.on('error', error => {
      debug(error);
    });

    request.on('end', () => {
      const filepath = 'test/examples/from-file.flowed.json';

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

  testServer.listen(3333);
}
