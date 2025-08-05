const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const DistributionEp = require('../end-point/Distribution-ep')
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get(
    "/get-all-distribution-centers",
    authMiddleware,
    DistributionEp.getDistributionCenterDetails
)

router.post(
    '/create-distribution-center',
    authMiddleware,
    upload.single("file"),
    DistributionEp.createDistributionCenter
)

router.get(
    "/get-all-center-officers-for-dch",
    authMiddleware,
    DistributionEp.getAllCenterOfficersForDCH
)

router.get(
    "/get-distribution-center-officers",
    authMiddleware,
    DistributionEp.getDistributionCenteOfficers
)


router.get(
    "/get-distribution-orders",
    authMiddleware,
    DistributionEp.getDistributionOrders
)

router.post(
    "/assign-orders-to-center-officers",
    authMiddleware,
    DistributionEp.assignOrdersToCenterOfficers
)

router.get(
    '/get-all-request',
    authMiddleware,
    DistributionEp.getAllRequestEp
)

router.post(
    '/approve-request',
    authMiddleware,
    DistributionEp.approveRequestEp
)

router.post(
    '/reject-request',
    authMiddleware,
    DistributionEp.rejectRequestEp
)

module.exports = router;