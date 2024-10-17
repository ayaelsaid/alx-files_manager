import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AppController {
  async getStatus(req, res) {
    const rStatus = redisClient.isAlive();
    const dbStatus = await dbClient.isAlive();

    res.status(200).json({
      redis: rStatus,
      db: dbStatus,
    });
  }

  async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    res.status(200).json({
      users,
      files,
    });
  }
}

export default AppController;
