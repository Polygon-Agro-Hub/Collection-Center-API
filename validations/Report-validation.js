const Joi = require('joi');

exports.getAllOfficersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    role: Joi.string().optional(),
    center: Joi.number().integer().optional(),

});

exports.getCollectionFarmerListQuaryParmsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),
    date: Joi.date().optional(),
});

exports.invNoParmsSchema = Joi.object({
    invNo: Joi.string().trim().min(1).required(),
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
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    searchText: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
});


exports.getAllCollectionSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
    searchText: Joi.string().allow('').optional(),
    
});


exports.downloadAllPaymentsSchema = Joi.object({
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
    searchText: Joi.string().allow('').optional(),
});

exports.downloadAllCollectionsSchema = Joi.object({
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    center: Joi.number().integer().optional(),
    searchText: Joi.string().allow('').optional(),
});

exports.getAllCenterPaymentsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    centerId: Joi.number().integer().required(),
    searchText: Joi.string().allow('').optional(),
    
});

exports.downloadAllCenterPaymentsSchema = Joi.object({
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    centerId: Joi.number().integer().required(),
    searchText: Joi.string().allow('').optional(),
});

exports.IdParmsSchema = Joi.object({
    id: Joi.number().integer().required()
});
