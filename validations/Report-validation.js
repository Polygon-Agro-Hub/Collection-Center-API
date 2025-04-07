const Joi = require('joi');

exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    role: Joi.string().optional(),

});

exports.getCollectionFarmerListQuaryParmsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    date: Joi.date().optional(),
});

exports.IdParmsSchema = Joi.object({
    id: Joi.number().integer().required()
});

exports.dailyReportSchema = Joi.object({
    id: Joi.number().integer().required(),
    date: Joi.date().required()
});

exports.monthlyReportSchema = Joi.object({
    id: Joi.number().integer().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required()
});

exports.getAllPaymentsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .message('Date must be in YYYY-MM-DD format')
        .optional()
        .allow(''),
    month: Joi.string()
        .pattern(/^\d{4}-\d{2}$/)
        .message('Month must be in YYYY-MM format')
        .optional()
        .allow('')
});

exports.getAllCollectionSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .message('Date must be in YYYY-MM-DD format')
        .optional()
        .allow(''),
    month: Joi.string()
        .pattern(/^\d{4}-\d{2}$/)
        .message('Month must be in YYYY-MM format')
        .optional()
        .allow('')
});

// status: Joi.string().optional(),
    // role: Joi.string().optional(),
    // center: Joi.number().integer().optional()


