const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ReporttEP = require('../end-point/Report-ep')

const router = express.Router();

router.get(
    "/get-collection-reports-details",
    authMiddleware,
    ReporttEP.getAllCollectionReportsDetails
)


module.exports = router;