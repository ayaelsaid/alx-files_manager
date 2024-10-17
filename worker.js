import thumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './db';
import fileQueue from './queues/fileQueue';

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const documentUser = await dbClient.collection('users').findOne({ _id: new ObjectId(userId) });
  const documentFile = await dbClient.collection('files').findOne({ _id: new ObjectId(fileId) });

  if (!documentFile || !documentUser) {
    throw new Error('File not found');
  }
  console.log(`Welcome ${documentUser.email}!`);
  const sizes = [500, 250, 100];
  const promises = sizes.map(async (size) => {
    const thumbnailPath = `${documentFile.localPath}_${size}.jpg`;
    const choosenSize = { width: size };

    try {
      const thumbnailImage = await thumbnail(documentFile.localPath, choosenSize);
      fs.writeFileSync(thumbnailPath, thumbnailImage);
    } catch (error) {
      console.error(`Error generating thumbnail for size ${size}:`, error);
    }
  });

  await Promise.all(promises);
});
fileQueue.on('completed', (job, result) => {
  console.log(result);
});

fileQueue.on('failed', (job, err) => {
  console.error(err.message);
});
