require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const helmet = require('helmet');
const usersRoutes = require('./routes/users');
const cardsRoutes = require('./routes/cards');
const NotFound = require('./errors/NotFoundError');
const { login, createUser, logout } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { validatorLogin, validatorUser } = require('./middlewares/joiValidate');
const handleErrors = require('./middlewares/handleErrors');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const allowCors = require('./middlewares/cors');

const { PORT = 3000 } = process.env;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(allowCors);
app.use(requestLogger);
app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадет');
  }, 0);
});
app.post('/signin', validatorLogin, login);
app.post('/signup', validatorUser, createUser);
app.get('/signout', logout);
app.use('/users', auth, usersRoutes);
app.use('/cards', auth, cardsRoutes);
app.use('*', auth, () => {
  throw new NotFound('Запрашиваемая страница не найдена');
});

mongoose.connect('mongodb://localhost:27017/mestodb', { useNewUrlParser: true, family: 4 });

app.use(errorLogger);

app.use(errors());

app.use(handleErrors);

app.listen(PORT);
