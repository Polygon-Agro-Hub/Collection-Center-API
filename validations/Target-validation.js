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

exports.getAllPriceDetailSchema = Joi.object({
    centerId: Joi.number().integer().optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    grade: Joi.string().optional(),
    searchText: Joi.string().optional()

});

exports.assignDailyTargetSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});


exports.IdValidationSchema = Joi.object({
    id: Joi.number().integer().required()
});

exports.getOfficerTargetSchema = Joi.object({
    status: Joi.string().optional(),
    search: Joi.string().optional(),
    limit: Joi.string().optional(),

});


exports.PassTargetValidationSchema = Joi.object({
    officerId: Joi.number().integer().required(),
    target: Joi.number().integer().required(),
    amount: Joi.number().required(),
});

exports.getSelectedOfficerTargetSchema = Joi.object({
    officerId: Joi.number().integer().optional(),
    status: Joi.string().optional(),
    search: Joi.string().optional(),

});

exports.getExsistVerityTargetSchema = Joi.object({
    targetid: Joi.number().integer().required(),
    cropid: Joi.number().integer().required(),
});

exports.getCenterTargetSchema = Joi.object({
    centerId: Joi.number().integer().min(1).default(1).optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(),

});

exports.addOrRemoveCenterCropSchema = Joi.object({
    centerId: Joi.number().integer().optional(),
    isAssign: Joi.number().integer().optional(),
    cropId: Joi.number().integer().optional(),

});

exports.getCenterCropsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional()

});

exports.getSavedCenterCropsSchema = Joi.object({
    id: Joi.number().integer().required(),
    date: Joi.date().required()
});

exports.getSavedCenterCropsQuaryParam = Joi.object({
    searchText: Joi.string().optional()
});

exports.updateTargetQtySchema = Joi.object({
    id: Joi.number().integer().allow(null).required(), 
    qty: Joi.number().required(),
    date: Joi.date().required(),
    companyCenterId: Joi.number().integer().required(),
    grade: Joi.string().required(),
    varietyId: Joi.number().integer().required(),
});

exports.getTargetVeritySchema = Joi.object({
    varietyId: Joi.number().integer().required(),
    companyCenterId: Joi.number().integer().required(),
});

exports.downloadOfficerTargetSchema = Joi.object({
    fromDate: Joi.string().allow('').optional(),
    toDate: Joi.string().allow('').optional(),
    jobRole: Joi.string().allow().optional(),
    empId: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),
    validity: Joi.string().allow('').optional(),
    searchText: Joi.string().allow('').optional()
});

