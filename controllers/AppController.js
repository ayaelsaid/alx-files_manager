import redisClient from '../utils/redis';
import dbClient from '../utils/db';
/* eslint-disable class-methods-use-this */

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
