const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const AuthError = require('../errors/AuthError');
const ConflictError = require('../errors/ConflictError');

const getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.send({ data: users }))
    .catch(next);
};

const getUserById = (req, res, next) => {
  const { _id } = req.params;
  User.findById(_id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Запрашиваемый пользователь не найден');
      }
      res.send({ data: user });
    })
    .catch(next);
};

const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    }))
    .then((user) => res.status(201).send({
      data: {
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        email: user.email,
        _id: user._id,
      },
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
      }
      if (err.code === 11000) {
        next(new ConflictError('Вы уже зарегистрированы, выполните вход'));
      } else { next(err); }
    });
};

const updateUserInfo = (req, res, next) => {
  const { name, about } = req.body;
  const { _id } = req.user;

  User.findByIdAndUpdate(_id, { name, about }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Запрашиваемый пользователь не найден');
      }
      res.send({ data: user });
    })
    .catch((err) => {
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else { next(err); }
    });
};

const updateUserAvatar = (req, res, next) => {
  const { avatar } = req.body;
  const { _id } = req.user;

  User.findByIdAndUpdate(_id, { avatar }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Запрашиваемый пользователь не найден');
      }
      res.send({ data: user });
    })
    .catch((err) => {
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные'));
      } else { next(err); }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'secret-key',
        { expiresIn: '7d' },
      );
      res.send({ token });
    })
    .catch(() => {
      next(new AuthError('Ошибка авторизации'));
    });
};

const getCurrentUser = (req, res, next) => {
  const { _id } = req.user;
  User.findById(_id)
    .orFail(() => new NotFoundError('Запрашиваемый пользователь не найден'))
    .then((user) => {
      res.status(200).send({ data: user });
    })
    .catch(next);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUserInfo,
  updateUserAvatar,
  login,
  getCurrentUser,
};
