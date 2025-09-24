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

// router.get(
//     "/get-centers-dch-own",
//     authMiddleware,
//     DistributedManageOfficerEP.getDCHOwnCenters
// )

router.get(
    "/get-distribution-center-managers/:id",
    authMiddleware,
    DistributedManageOfficerEP.getDistributionCenterManager
)

router.get(
    "/get-last-emp-id/:role",
    authMiddleware,
    DistributedManageOfficerEP.getForCreateId
)

router.post(
    "/create-officer",
    authMiddleware,
    upload.single("file"),
    DistributedManageOfficerEP.createOfficer
)

router.post(
    "/create-officer-dio",
    authMiddleware,
    upload.single("file"),
    DistributedManageOfficerEP.createOfficerDIO
)

router.get(
    "/get-officer-by-id/:id",
    authMiddleware,
    DistributedManageOfficerEP.getOfficerById
);

router.put(
    '/update-officer/:id', 
    authMiddleware, 
    upload.single("file"),
    DistributedManageOfficerEP.updateDistributionOfficer
);

router.put(
    '/update-officer-dio/:id', 
    authMiddleware, 
    upload.single("file"),
    DistributedManageOfficerEP.updateDistributionOfficerDIO
);

router.delete(
    "/delete-officer/:id",
    authMiddleware,
    DistributedManageOfficerEP.deleteOfficer
)

router.get(
    "/update-status/:id/:status",
    authMiddleware,
    DistributedManageOfficerEP.UpdateStatusAndSendPassword
)

module.exports = router;
