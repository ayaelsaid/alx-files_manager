
import dbClient from '../utils/db.js';
import crypto from 'crypto'; 



class UsersController {
    
    static async postNew(req, res) {
        const { name, email, password } = req.body;
    
        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
    
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }
    
        const existingUser = await dbClient.db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Already exists' });
        }
    
        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    
        const result = await dbClient.db.collection('users').insertOne({
            name,
            email,
            password: hashedPassword,
        });
    
        await userQueue.add({ userId: result.insertedId });
    
        return res.status(201).json({ id: result.insertedId, email });
    }    
    static async getMe(req, res) {
    
            const token = req.headers['x-token']; 
            const userId = await redisClient.get(`auth_${token}`); 


            const user = await dbClient.db.collection('users').findOne({ _id: userId }); 
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            return res.status(200).json({ email: user.email, id: user._id.toString() });
        }
            

        
}




export default UsersController;
