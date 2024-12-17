const Joi = require('joi');

exports.getRoleShema = Joi.object({
    role: Joi.string().required(),
})

exports.getCenterIdShema = Joi.object({
    centerId: Joi.number().required(),
})