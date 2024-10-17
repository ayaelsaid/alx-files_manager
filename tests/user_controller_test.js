import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import crypto from 'crypto';
import app from './server.js';
import dbClient from './db';
import userQueue from './queues/userQueue';

describe('pOST /users', () => {
  let email;
  let name;
  let userId;

  beforeEach(() => {
    email = 'ahmd@gmail.com';
    name = 'ahmed';
    userId = 1;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create a new user and return status 201 with user details', async () => {
    const findOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne').returns(Promise.resolve(null));
    const insertOneStub = sinon.stub(dbClient.db.collection('users'), 'insertOne').returns(Promise.resolve({ insertedId: userId }));

    const addStub = sinon.stub(userQueue, 'add').returns(Promise.resolve());

    const response = await request(app)
      .post('/users')
      .send({ name, email, password: 'pass123456789' });

    expect(response.status).to.equal(201);
    expect(response.body).to.deep.equal({ id: userId, email });

    expect(findOneStub.calledOnce).to.be.true;
    expect(insertOneStub.calledOnce).to.be.true;
    expect(addStub.calledOnce).to.be.true;
  });

  it('should return status 400 if email is missing', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name, password: 'pass123456789' });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({ error: 'Missing email' });
  });

  it('should return status 400 if password is missing', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name, email });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({ error: 'Missing password' });
  });

  it('should return status 400 if user already exists', async () => {
    const findOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne').returns(Promise.resolve({ email }));

    const response = await request(app)
      .post('/users')
      .send({ name, email, password: 'pass123456789' });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({ error: 'Already exists' });
  });
});
// tests/auth.test.js
describe('gET /me', () => {
  let token;
  let userId;
  let user;

  beforeEach(() => {
    token = 'valid';
    userId = 'userId145';
    user = {
      _id: userId,
      email: 'hello@yahoo.com',
      password: 'hashedPassword',
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return status 200 and user if token valid', async () => {
    sinon.stub(redisClient, 'get').returns(Promise.resolve(userId));
    sinon.stub(dbClient.db.collection('users'), 'findOne').returns(Promise.resolve(user));

    const response = await request(app)
      .get('/me')
      .set('x-token', token);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ email: user.email, id: user._id.toString() });
  });

  it('should return status 401 if token  invalid', async () => {
    sinon.stub(redisClient, 'get').returns(Promise.resolve(null));

    const response = await request(app)
      .get('/me')
      .set('x-token', token);

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({ error: 'Unauthorized' });
  });
});
