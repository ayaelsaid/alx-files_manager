import express from 'express';
import router from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);
app.listen(port);
