const Joi = require('joi');

exports.getAllPriceListSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    grade: Joi.string().optional(),
});

exports.getRequestPriceSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    grade: Joi.string().optional(),
    status: Joi.string().optional()
    
});