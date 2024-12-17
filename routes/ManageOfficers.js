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


module.exports = router;