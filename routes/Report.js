const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ReporttEP = require('../end-point/Report-ep')
reportDao = require('../dao/Report-dao');
const XLSX = require('xlsx');

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
  authMiddleware,
  ReporttEP.getFarmerReport
)

router.get(
  "/get-all-payments",
  authMiddleware,
  ReporttEP.getAllPayments
)

router.get(
  "/download-payment-report",
  authMiddleware,
  ReporttEP.downloadAllPayments
)

router.get(
  "/download-collection-report",
  authMiddleware,
  ReporttEP.downloadAllCollections
)



router.get(
  "/get-all-collection",
  authMiddleware,
  ReporttEP.getAllCollection
)

router.get(
  "/get-all-center-payments",
  authMiddleware,
  ReporttEP.getAllCenterPayments
)

router.get(
  "/download-center-payment-report",
  authMiddleware,
  ReporttEP.downloadAllCenterPayments
)

router.get(
  "/get-farmer-report-invoice-details/:invNo",
  authMiddleware,
  ReporttEP.getFarmerReportInvoice
)




module.exports = router;


