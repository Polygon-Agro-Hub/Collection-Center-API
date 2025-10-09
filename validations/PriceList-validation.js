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

exports.forwardRequestSchema = Joi.object({
    id: Joi.number().integer().required(),
});

exports.getCropVarietySchema = Joi.object({
    cropGroupId: Joi.number().integer().required(),
});

exports.getCurrentPriceSchema = Joi.object({
    cropGroupId: Joi.number().integer().required(),
    cropVarietyId: Joi.number().integer().required(),
    grade: Joi.string().optional(),
});


exports.addRequestSchema = Joi.object({
    id: Joi.number().integer().required(),
    cropGroupId: Joi.number().integer().required(),
    cropVarietyId: Joi.number().integer().required(),
    grade: Joi.string().required(),
    currentPrice: Joi.number().integer().required(),
    requstPrice: Joi.number().integer().required(),
    
});

exports.selectedRequestSchema = Joi.object({
    requestId: Joi.number().integer().required(),
});


exports.getPriceListCCHSchema = Joi.object({
    userId: Joi.number().integer().required(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    grade: Joi.string().optional(),
    status: Joi.string().optional()
    
});

exports.changeStatusSchema = Joi.object({
    requestId: Joi.number().integer().required(),
    requestPrice: Joi.string().required(),
    centerId: Joi.number().integer().required(),
});

exports.rejectStatusSchema = Joi.object({
    requestId: Joi.number().integer().required(),
   
});


exports.changeStatusCCMSchema = Joi.object({
    requestId: Joi.number().integer().required(),
    requestPrice: Joi.string().required()
});


