const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ReporttEP = require('../end-point/Report-ep')

const router = express.Router();

router.get(
    "/get-collection-reports-details",
    authMiddleware,
    ReporttEP.getAllCollectionReportsDetails
)

router.get(
    "/get-sales-reports-details",
    authMiddleware,
    ReporttEP.getAllSalesReportsDetails
)

router.get(
    "/get-collection-farmer-list/:id",
    authMiddleware,
    ReporttEP.getCollectionFarmersList
)

router.get(
    "/get-daily-report/:id/:date",
    authMiddleware,
    ReporttEP.getDailyReport
)

router.get(
    "/get-monthly-officer-details/:id/:startDate/:endDate",
    authMiddleware,
    ReporttEP.getMonthlyReportOfficer
)

router.get(
    "/get-farmer-report-details/:id",
    // authMiddleware,
    ReporttEP.getFarmerReport
)



module.exports = router;


