const Joi = require('joi');

exports.getDistributionCenterSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    province: Joi.string().optional(),
    district: Joi.string().optional()

});