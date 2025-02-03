const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const TargetEP = require('../end-point/Target-ep')

const router = express.Router();

router.get(
    '/get-crop-category',
    authMiddleware,
    TargetEP.getAllCropCatogory
)

router.post(
    "/create-daily-target",
    authMiddleware,
    TargetEP.addDailyTarget
)

router.get(
    "/get-daily-target",
    authMiddleware,
    TargetEP.getAllDailyTarget
)

router.get(
    "/download-daily-target",
    authMiddleware,
    TargetEP.downloadDailyTarget
)

router.get(
    "/get-all-centers",
    authMiddleware,
    TargetEP.getCenterDetails
)

router.get(
    "/get-center-dashboard/:id",
    authMiddleware,
    TargetEP.getCenterDashbord
)

router.get(
    "/get-all-officers",
    authMiddleware,
    TargetEP.getOfficerDetails
)

router.get(
    '/get-all-price',
    authMiddleware,
    TargetEP.getAllPriceDetails
)


module.exports = router;