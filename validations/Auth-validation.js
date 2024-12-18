// // admin-validation.js
// const Joi = require('joi');

// exports.loginAdminSchema = Joi.object({
//     email: Joi.string().email().required(),
//     password: Joi.string().required()
// });

const Joi = require("joi");

exports.loginUserSchema = Joi.object({
  userName: Joi.string().required(),
  password: Joi.string().required(),
});

exports.logInUpdate = Joi.object({
  id: Joi.number().required(),
  newPassword: Joi.string().required(),
});
