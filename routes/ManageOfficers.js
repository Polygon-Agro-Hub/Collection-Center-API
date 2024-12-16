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


module.exports = router;