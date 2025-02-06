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

router.get(
    "/assign-all-daily-target",
    authMiddleware,
    TargetEP.getAssignCenterTarget
)

router.get(
    '/get-target-verity/:id',
    authMiddleware,
    TargetEP.getTargetVerity
)

router.post(
    '/assing-officer-target',
    authMiddleware,
    TargetEP.AssignOfficerTarget
)

router.get(
    '/get-officer-target-by-id/:id',
    authMiddleware,
    TargetEP.getTargetDetailsToPass
)

router.patch(
    '/pass-target-to-officer',
    authMiddleware,
    TargetEP.passTargetToOfficer
)

router.get(
    '/get-officer-target-data',
    authMiddleware,
    TargetEP.getOfficerTarget
)


module.exports = router;
