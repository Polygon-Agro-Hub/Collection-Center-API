const express = require('express');
const ManageOfficerEP = require('../end-point/ManageOfficers-ep');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();


router.get(
    "/get-all-center",
    authMiddleware,
    ManageOfficerEP.getAllCollectionCenter
)

router.get(
    "/get-last-emp-id/:role",
    authMiddleware,
    ManageOfficerEP.getForCreateId
)

router.post(
    "/create-officer",
    authMiddleware,
    upload.single("file"),
    ManageOfficerEP.createOfficer
)

router.get(
    "/get-by-managerID/:centerId",
    authMiddleware,
    ManageOfficerEP.getManagerIdByCenterId
)

router.get(
    "/get-all-officers",
    authMiddleware,
    ManageOfficerEP.getAllOfficers
)

router.get(
    "/get-all-company-names",
    authMiddleware,
    ManageOfficerEP.getAllCompanyNames
)

router.delete(
    "/delete-officer/:id",
    authMiddleware,
    ManageOfficerEP.deleteOfficer
)

router.get(
    "/update-status/:id/:status",
    authMiddleware,
    ManageOfficerEP.UpdateStatusAndSendPassword
)

router.get(
    "/get-officer-by-id/:id",
    authMiddleware,
    ManageOfficerEP.getOfficerById
);

router.put(
    '/update-officer/:id', 
    authMiddleware, 
    upload.single("file"),
    ManageOfficerEP.updateCollectionOfficer
);

router.put(
    '/disclaim-officer/:id',
    authMiddleware,
    ManageOfficerEP.disclaimOfficer
)

router.get('/get-officer-by-empId/:id',
    authMiddleware,
    ManageOfficerEP.getOfficerByEmpId
);

router.patch('/claim-officer',
    authMiddleware,
    ManageOfficerEP.claimOfficer
);

router.get('/get-target-details/:id',
    authMiddleware,
    ManageOfficerEP.getTargetDetails
);

router.patch(
    '/edit-officer-target',
    authMiddleware,
    ManageOfficerEP.editOfficerTarget
)

router.get(
    "/get-all-officers-for-cch",
    authMiddleware,
    ManageOfficerEP.getAllOfficersForCCH
)

router.get(
    "/get-centers-cch-own",
    authMiddleware,
    ManageOfficerEP.getCCHOwnCenters
)

router.get(
    "/get-centers-with-reg-cch-own",
    authMiddleware,
    ManageOfficerEP.getCCHOwnCentersWithRegCode
)


router.get(
    "/get-center-managers/:id",
    authMiddleware,
    ManageOfficerEP.getCenterManager
)

router.post(
    "/cch-create-officer",
    authMiddleware,
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'licFront', maxCount: 1 },
        { name: 'licBack', maxCount: 1 },
        { name: 'insFront', maxCount: 1 },
        { name: 'insBack', maxCount: 1 },
        { name: 'vehiFront', maxCount: 1 },
        { name: 'vehiBack', maxCount: 1 },
        { name: 'vehiSideA', maxCount: 1 },
        { name: 'vehiSideB', maxCount: 1 }
    ]),
    ManageOfficerEP.CCHcreateOfficer
)

router.put(
    '/cch-update-officer/:id', 
    authMiddleware, 
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'licFront', maxCount: 1 },
        { name: 'licBack', maxCount: 1 },
        { name: 'insFront', maxCount: 1 },
        { name: 'insBack', maxCount: 1 },
        { name: 'vehiFront', maxCount: 1 },
        { name: 'vehiBack', maxCount: 1 },
        { name: 'vehiSideA', maxCount: 1 },
        { name: 'vehiSideB', maxCount: 1 }
    ]),
    ManageOfficerEP.CCHupdateCollectionOfficer
);

router.get(
    "/get-profile-image-base64-by-id/:id",
    authMiddleware,
    ManageOfficerEP.getProfileImageBase64ById
);

router.get(
    "/get-centers-dch-own",
    authMiddleware,
    ManageOfficerEP.getDCHOwnCenters
)

router.get(
    "/get-distribution-center-managers/:id",
    authMiddleware,
    ManageOfficerEP.getDistributionCenterManager
)


module.exports = router;

