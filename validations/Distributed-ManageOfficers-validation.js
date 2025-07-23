const Joi = require('joi');

exports.getRoleShema = Joi.object({
    role: Joi.string().required(),
})


exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().optional(),
    role: Joi.string().optional(),
    center: Joi.number().integer().optional()
    
});

exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().optional(),
    role: Joi.string().optional(),
    center: Joi.number().integer().optional()
    
});