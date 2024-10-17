import { expect } from 'chai';
import sinon from 'sinon';
import http from 'http';
import app from '../server';
import dbClient from '../utils/db';

const server = http.createServer(app); // Create server instance for testing

describe('GET /status', () => {
  it('should return status 200 and a message', (done) => {
    http.get('http://localhost:5000/status', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        expect(res.statusCode).to.equal(200);
        expect(JSON.parse(data)).to.deep.equal({ redis: true, db: true });
        done();
      });
    });
  });
});

describe('GET /stats', () => {
  let nbUsersStub;
  let nbFilesStub;

  beforeEach(() => {
    nbUsersStub = sinon.stub(dbClient, 'nbUsers');
    nbFilesStub = sinon.stub(dbClient, 'nbFiles');
  });

  afterEach(() => {
    nbUsersStub.restore();
    nbFilesStub.restore();
  });

  it('should return status 200 and user and file counts', (done) => {
    nbUsersStub.returns(Promise.resolve(12));
    nbFilesStub.returns(Promise.resolve(1231));

    http.get('http://localhost:5000/stats', (res) => { // Update the port if needed
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        expect(res.statusCode).to.equal(200);
        expect(JSON.parse(data)).to.deep.equal({ users: 12, files: 1231 });
        done(); // Indicate that the test is complete
      });
    });
  });
});
