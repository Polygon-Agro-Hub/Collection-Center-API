const Joi = require('joi');


exports.getAllDailyTargetSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
});


exports.downloadDailyTargetSchema = Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required()
});

exports.getCentersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    search: Joi.string().allow('').optional(),
    grade: Joi.string().optional(),
    status: Joi.string().optional()
    
});

exports.getOfficerDetailsSchema = Joi.object({
    centerId: Joi.number().integer().optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    role: Joi.string().allow('').optional(),
    status: Joi.string().optional(),
    searchText: Joi.string().optional()
    
});