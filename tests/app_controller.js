import request from 'supertest';
import app from '../server';
import dbClient from '../utils/db';
import sinon from 'sinon';

describe('get /status', () => {
  it('should return status 200 and a message', async () => {
    expect.assertions(2);
    const response = await request(app).get('/status');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ redis: true, db: true });
  });
});

describe('get /stats', () => {
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
    expect.assertions(2);
    nbUsersStub.returns(Promise.resolve(12));
    nbFilesStub.returns(Promise.resolve(1231));

    const response = await request(app).get('/stats');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ users: 12, files: 1231 });
  });
});
