const Joi = require('joi');

exports.getDistributionCenterSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    province: Joi.string().optional(),
    district: Joi.string().optional()

});

exports.getAllCenterOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    centerId: Joi.number().integer().required(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().optional(),
    role: Joi.string().optional(),
    center: Joi.number().integer().optional()
    
});

exports.getRequestSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    date: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),
    searchText: Joi.string().allow('').optional()
    
    
});

exports.dcmGetAllAssignOrdersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),
    date: Joi.string().allow('').optional(),

});

exports.dcmGetCompletedAssignOrdersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    date: Joi.string().allow('').optional(),

});

exports.dcmGetOutForDeliveryOrdersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),

});