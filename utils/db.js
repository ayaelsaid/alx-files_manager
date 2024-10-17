import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        this.DB_HOST = process.env.DB_HOST || 'localhost';
        this.DB_PORT = process.env.DB_PORT || 27017;
        this.DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

        

        this.client = new MongoClient(`mongodb://${this.DB_HOST}:${this.DB_PORT}`, { useUnifiedTopology: true });
        this.db = null;

        this.client.connect()
            .then(() => {
                this.db = this.client.db(this.DB_DATABASE);
            })
            .catch((err) => {
                console.error('error:', err);
            });
    }

    async isAlive() {
        try {
            await this.client.db(this.DB_DATABASE).command({ ping: 1 });
            return true;
        } catch (err) {
            return false;
        }
    }
    async nUsers(){
        if (!this.db) return 0;
        const count = await this.db.collection('users').countDocuments();
        return count;
    }

    async nbFiles() {
        const count = await this.db.collection('files').countDocuments();
        return count;
    }
}

const dbClient = new DBClient();
export default dbClient;
