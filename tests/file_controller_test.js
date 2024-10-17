describe('POST /files', () => {
    it('should create a new file', async () => {
        const fileData = { name: 'myfile.txt', content: 'you can make it' };

        sinon.stub(dbClient.db.collection('files'), 'insertOne').returns(Promise.resolve({ insertedId: 'fileId123' }));

        const response = await request(app)
            .post('/files')
            .send(fileData);

        expect(response.status).to.equal(201);
        expect(response.body).to.deep.equal({ id: 'fileId145', ...fileData });
    });
});
describe('GET /files/:id', () => {
    it('should return the file details for specific id', async () => {
        const fileId = 'fileId145';
        const fDetails = { _id: fileId, name: 'myfile.txt', content: 'you can make it' };

        sinon.stub(dbClient.db.collection('files'), 'findOne').returns(Promise.resolve(fDetails));

        const response = await request(app)
            .get(`/files/${fileId}`);

        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal(fDetails);
    });
});
describe('GET /files', () => {
    it('should return paginated file', async () => {
        const files = [
            { _id: 'fileId145', name: 'file1.txt' },
            { _id: 'fileId146', name: 'file2.txt' },
        ];

        const page = 2;
        const limit = 2;
        sinon.stub(dbClient.db.collection('files'), 'find').returns({
            skip: sinon.stub().returnsThis(),
            limit: sinon.stub().returnsThis(),
            toArray: sinon.stub().returns(Promise.resolve(files))
        });

        const response = await request(app)
            .get(`/files?page=${page}&limit=${limit}`);

        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal(files);
    });
});

describe('PUT /files/:id/publish', () => {
    it('should publish the file', async () => {
        const fileId = 'fileId145';

        sinon.stub(dbClient.db.collection('files'), 'updateOne').returns(Promise.resolve({ modifiedCount: 1 }));

        const response = await request(app)
            .put(`/files/${fileId}/publish`);

        expect(response.status).to.equal(204);
    });
});
describe('PUT /files/:id/unpublish', () => {
    it('should unpublish ', async () => {
        const fileId = 'fileId145';

        sinon.stub(dbClient.db.collection('files'), 'updateOne').returns(Promise.resolve({ modifiedCount: 1 }));

        const response = await request(app)
            .put(`/files/${fileId}/unpublish`);

        expect(response.status).to.equal(204);
    });
});
describe('GET /files/:id/data', () => {
    it('should return the file data', async () => {
        const fileId = 'fileId145';
        const fileContent = 'welcome ';

        sinon.stub(dbClient.db.collection('files'), 'findOne').returns(Promise.resolve({ _id: fileId, content: fileContent }));

        const response = await request(app)
            .get(`/files/${fileId}/data`);

        expect(response.status).to.equal(200);
        expect(response.text).to.equal(fileContent);
    });
});
