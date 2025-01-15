const express = require('express');
const ManageOfficerEP = require('../end-point/ManageOfficers-ep');
const authMiddleware = require('../middlewares/authMiddleware');

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
    // authMiddleware,
    ManageOfficerEP.getOfficerById
);

router.put(
    '/update-officer/:id', 
    authMiddleware, 
    ManageOfficerEP.updateCollectionOfficer
);

module.exports = router;