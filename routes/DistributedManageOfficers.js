const express = require('express');
const DistributedManageOfficerEP = require('../end-point/Distributed-ManageOfficer-ep');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get(
    "/get-all-officers",
    authMiddleware,
    DistributedManageOfficerEP.getAllOfficers
)

router.get(
    "/get-all-officers-for-dch",
    authMiddleware,
    DistributedManageOfficerEP.getAllOfficersForDCH
)

router.get(
    "/get-all-company-names",
    authMiddleware,
    DistributedManageOfficerEP.getAllCompanyNames
)

router.get(
    "/get-centers-dch-own",
    authMiddleware,
    DistributedManageOfficerEP.getDCHOwnCenters
)

module.exports = router;
