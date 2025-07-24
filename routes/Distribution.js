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


module.exports = router;