const express = require('express');
const ManageOfficerEP = require('../end-point/ManageOfficers-ep')

const router = express.Router();


router.get(
    "/get-all-center",
    ManageOfficerEP.getAllCollectionCenter
)

router.get(
    "/get-last-emp-id/:role",
    ManageOfficerEP.getForCreateId
)

router.post(
    "/create-officer",
    ManageOfficerEP.createOfficer
)

router.get(
    "/get-by-managerID/:centerId",
    ManageOfficerEP.getManagerIdByCenterId
)

router.get(
    "/get-all-officers",
    ManageOfficerEP.getAllOfficers
)

router.get(
    "/get-all-company-names",
    ManageOfficerEP.getAllCompanyNames
)

router.delete(
    "/delete-officer/:id",
    ManageOfficerEP.deleteOfficer
)

router.get(
    "/update-status/:id/:status",
    ManageOfficerEP.UpdateStatusAndSendPassword
)

module.exports = router;