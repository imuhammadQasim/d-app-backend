const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { MONGO_URI, PORT, WINDOW, MAX_LIMIT, FRONTEND_URL } = require('./config');
require('./models');
const { REGULAR_HANDLER } = require('./helpers');
const MIDDLEWARE = require('./middleware');
const rateLimit = require('express-rate-limit');

mongoose.Promise = global.Promise;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => console.log(err));
process.title = 'INTD-USERS';

const app = express();
app.set('trust proxy', 1);
// app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('tiny'));
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET','OPTIONS','POST',],
  }),
);


const RATE_LIMITER = rateLimit({
  windowMs: WINDOW * 1000,
  max: MAX_LIMIT,
  message: `Too many requests to this end-point, please try again after ${WINDOW} seconds`,
});

app.get('/user/health', (req, res) => {
  res.send('OK');
});

app.use('/user', RATE_LIMITER, require('./routes'), REGULAR_HANDLER);
app.use('/user', RATE_LIMITER, MIDDLEWARE, require('./routes/protectedRoutes'), REGULAR_HANDLER);

app.use((req, res) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

app.listen(PORT, () => {
  console.log(`--------------------------------------------------------------`);
  console.log(`Server started on port ${PORT}`);
  console.log(`--------------------------------------------------------------`);
});
