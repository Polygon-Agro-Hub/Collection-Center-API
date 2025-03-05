const Joi = require('joi');

exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
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


