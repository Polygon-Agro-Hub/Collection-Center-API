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

router.get('/download-payment-report', async (req, res) => {
    try {

      console.log(req.query);

      const {centerId, monthNumber, createdDate, search} = req.query;
      console.log({centerId, monthNumber, createdDate, search});
      // Fetch data from the database
      const data = await reportDao.downloadPaymentReport( 
        centerId,
        monthNumber,
        createdDate, 
        search);
  
      // Format data for Excel
      const formattedData = data.flatMap(item => [
        {
          'GRN': item.grnNumber,
          'Amount': item.amount,
          'Center Reg Code': item.regCode,
          'Center Name': item.centerName,
          'Farmer NIC': item.nic,
          'Farmer Name': item.firstName + ' ' + item.lastName,
          'Farmer contact': item.phoneNumber,
          'Account holder name': item.accHolderName,
          'Account Number': item.accNumber,
          'Bank Name': item.bankName,
          'Branch Name': item.branchName,
          'Officer EMP ID': item.empId,
          'Collected time': item.createdAt

        },
        
      ]);
      
  
      // Create a worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      worksheet['!cols'] = [
        { wch: 25 }, // GRN
        { wch: 15}, // Amount
        { wch: 20 }, // Center Reg Code
        { wch: 25 }, // Center Name
        { wch: 18 }, // Farmer NIC
        { wch: 25 }, // Farmer Name
        { wch: 15 }, // Farmer Contact
        { wch: 25 }, // Account Holder Name
        { wch: 20 }, // Account Number
        { wch: 20 }, // Bank Name
        { wch: 20 }, // Branch Name
        { wch: 15 }, // Officer EMP ID
        { wch: 15 }  // Collected Time
      ];


      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmer Payement Template');
  
      // Write the workbook to a buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename="Farmer Payement Template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Send the file to the client
      res.send(excelBuffer);
    } catch (err) {
      console.error('Error generating Excel file:', err);
      res.status(500).send('An error occurred while generating the file.');
    }
  });



module.exports = router;


