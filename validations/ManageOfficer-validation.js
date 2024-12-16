const Joi = require('joi');

exports.getRoleShema = Joi.object({
    role: Joi.string().required(),
})