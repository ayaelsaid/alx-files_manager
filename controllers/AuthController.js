import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class AuthController {
  static async getConnect(req, res) {
    
      const authHeader = req.headers.authorization || '';
      const base64Credentials = authHeader.split(' ')[1];
      if (!base64Credentials) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const [email, password] = Buffer.from(base64Credentials, 'base64').toString().split(':');

      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const passMatched = bcrypt.compareSync(password, user.password);
      if (!passMatched) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

      return res.status(200).json({ token });
  }

  static async disconnect(req, res) {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(`auth_${token}`);

      return res.status(204).json({});
    
  }
}

export default AuthController;
