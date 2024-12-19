const Joi = require('joi');

exports.getRoleShema = Joi.object({
    role: Joi.string().required(),
})

exports.getCenterIdShema = Joi.object({
    centerId: Joi.number().required(),
})


exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    company: Joi.string().optional(),
    role: Joi.string().optional()
});

exports.deleteOfficerSchema = Joi.object({
    id: Joi.number().required(),
})

exports.getOfficerByIdSchema = Joi.object({
    id: Joi.number().required(),
})