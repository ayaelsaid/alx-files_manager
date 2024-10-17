import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import mime from 'mime-types';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }
        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }
        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }
        if (parentId) {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const newFile = {
            userId,
            name,
            type,
            isPublic,
            parentId: parentId || 0,
        };

        if (type === 'folder') {
            const result = await dbClient.db.collection('files').insertOne(newFile);
            return res.status(201).json({ newFile, id: result.insertedId });
        } else {
            const filePath = path.join(FOLDER_PATH, `${uuidv4()}`);

            if (!fs.existsSync(FOLDER_PATH)) {
                fs.mkdirSync(FOLDER_PATH, { recursive: true });
            }

            const buffer = Buffer.from(data, 'base64');
            fs.writeFileSync(filePath, buffer);

            newFile.localPath = filePath;

            const result = await dbClient.db.collection('files').insertOne(newFile);
            return res.status(201).json({ newFile, id: result.insertedId });
        }
    }
    static async getShow(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const file = await dbClient.db.collection('files').findOne({ _id: id, userId });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        if (file.type === 'folder') {
            const childernFiles = await dbClient.db.collection('files').find({ parentId: file.id }).toArray();
            return res.json(childernFiles);
        } else {
            return res.sendFile(file.localPath, { headers: { 'Content-Type': file.type } });

    }

}
    static async getIndex(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { parentId = 0, page = 0 } = req.query;
        const nPerPage = 20;
        const nSkip = page * nPerPage;

        const aggregateFiles = await dbClient.db.collection('files').aggregate([
            { 
                $match: { parentId: Number(parentId), userId }
            },
            { 
                $skip: nSkip
            },
            { 
                $limit: nPerPage
            }
        ]).toArray();

        return res.json(aggregateFiles);
    }
    static async putPublish(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        const { id } = req.params;
    
        const result = await dbClient.db.collection('files').findOneAndUpdate(
            { _id: id, userId },
            { $set: { isPublic: true } },
            { returnOriginal: false } 
        );
    
        if (!result.value) {
            return res.status(404).json({ error: 'File not found' });
        }
    
        return res.status(200).json(result.value);
    }



static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: id, userId },
        { $set: { isPublic: false } },
        { returnOriginal: false } 
    );

    if (!result.value) {
        return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json(result.value);
}

static async getFile(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { size } = req.query; 

    if (size && ![500, 250, 100].includes(Number(size))) {
        return res.status(400).json({ error: 'Error' });
    }


    const file = await dbClient.db.collection('files').findOne({ _id: id });

    if (!file) {
        return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;
    if (size) {
        filePath = `${file.localPath}_${size}.jpg`;
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    return res.status(200).sendFile(filePath, { headers: { 'Content-Type': mimeType } });
}
}

export default FilesController;
