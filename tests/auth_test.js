describe('GET /connect', () => {
    let email;
    let password;
    let user;

    beforeEach(() => {
        email = 'nada@yahoo.com';
        password = 'pass123456789';
        user = {
            _id: 'userId125',
            email,
            password: bcrypt.hashSync(password, 10) 
        };
    });

    afterEach(() => {
        sinon.restore(); 
    });

    it('should return status 200 and a token if credentials are valid', async () => {
        const findOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne').returns(Promise.resolve(user));

        const response = await request(app)
            .get('/connect')
            .set('Authorization', `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`);

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('token');

        const tokenKey = `auth_${response.body.token}`;
        sinon.assert.calledOnce(redisClient.set);
        expect(redisClient.set.firstCall.args[0]).to.equal(tokenKey);
        expect(redisClient.set.firstCall.args[1]).to.equal(user._id.toString());
        expect(redisClient.set.firstCall.args[2]).to.equal(86400);
    });

    it('should return status 401 if no authorization header is provided', async () => {
        const response = await request(app).get('/connect');
        expect(response.status).to.equal(401);
        expect(response.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return status 401 if user is not found', async () => {
        const findOneStub = sinon.stub(dbClient.db.collection('users'), 'findOne').returns(Promise.resolve(null));

        const response = await request(app)
            .get('/connect')
            .set('Authorization', `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`);

        expect(response.status).to.equal(401);
        expect(response.body).to.deep.equal({ error: 'Unauthorized' });
    });

});
describe('GET /disconnect', () => {
    let token;

    beforeEach(() => {
        token = uuidv4();
        sinon.stub(redisClient, 'del').returns(Promise.resolve());
    });

    afterEach(() => {
        sinon.restore(); 
    });

    it('should return status 204 and delete the token from Redis', async () => {
        const response = await request(app).get('/disconnect').set('x-token', token);

        expect(response.status).to.equal(204);
        sinon.assert.calledOnce(redisClient.del);
        expect(redisClient.del.firstCall.args[0]).to.equal(`auth_${token}`);
    });

    it('should return status 401 if token is missing', async () => {
        const response = await request(app).get('/disconnect');
        expect(response.status).to.equal(401);
        expect(response.body).to.deep.equal({ error: 'Unauthorized' });
    });
});

