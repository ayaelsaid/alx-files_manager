import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from './server.js';
import dbClient from './db';

describe('gET /status', () => {
  it('should return status 200 and a message', async () => {
    const response = await request(app).get('/status');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ redis: true, db: true });
  });
});

describe('gET /stats', () => {
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

  it('should return status 200 and user and file counts', async () => {
    nbUsersStub.returns(Promise.resolve(12));
    nbFilesStub.returns(Promise.resolve(1231));

    const response = await request(app).get('/stats');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ users: 12, files: 1231 });
  });
});
