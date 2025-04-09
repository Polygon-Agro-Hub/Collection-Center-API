const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const TargetEP = require('../end-point/Target-ep');
const upload = require("../middlewares/uploadMiddleware");

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

//used
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

//dao missing
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
    '/get-target-verity/:varietyId/:companyCenterId',
    authMiddleware,
    TargetEP.getTargetVerity
)

//used
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

router.get(
    '/get-selected-officer-target-data',
    authMiddleware,
    TargetEP.getSelectedOfficerTarget
)

router.get(
    '/get-exist-veriety-target/:varietyId/:companyCenterId',
    authMiddleware,
    TargetEP.getExsistVerityTarget
)

router.post(
    '/edit-assigned-officer-target',
    authMiddleware,
    TargetEP.editAssignedOfficerTarget
)

router.post(
    '/create-center',
    authMiddleware,
    upload.single("file"),
    TargetEP.createCenter
)

router.get(
    "/get-center-target",
    authMiddleware,
    TargetEP.getCenterTarget
)

//-----------------new parts-------------------//
router.get(
    "/get-center-crops/:id",
    authMiddleware,
    TargetEP.getCenterCenterCrops
)

router.post(
    "/add-center-crops",
    authMiddleware,
    TargetEP.addOrRemoveCenterCrops
)

router.get(
    "/get-saved-center-crops/:id/:date",
    authMiddleware,
    TargetEP.getSavedCenterCrops
)

router.patch(
    "/update-target-crop-qty",
    authMiddleware,
    TargetEP.updateTargetQty
)

router.post(
    "/add-new-center-target",
    authMiddleware,
    TargetEP.addNewCenterTarget
)




module.exports = router;




