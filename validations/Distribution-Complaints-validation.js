const Joi = require("joi");

exports.dcmGetAllDailyTargetSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),

    
});

exports.dcmGetparmasIdSchema = Joi.object({
    id: Joi.number().integer().required()
});

exports.dcmReplyComplainSchema = Joi.object({
    id: Joi.number().integer().required(),
    reply: Joi.string().required()
});

exports.dcmAddComplaintSchema = Joi.object({
    category: Joi.string().required(),
    complaint: Joi.string().required(),
});