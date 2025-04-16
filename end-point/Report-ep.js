const ReportDAO = require('../dao/Report-dao')
const ReportValidate = require('../validations/Report-validation');
const XLSX = require('xlsx');

exports.getAllCollectionReportsDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.getAllOfficersSchema.validateAsync(req.query);
    const { page, limit, searchText, role } = validatedQuery;
    console.log(validatedQuery);
    
    const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    const userId = req.user.userId

    const { items, total } = await ReportDAO.getAllOfficersDAO(centerId, companyId, userId, role, page, limit, searchText);

    console.log("Successfully fetched collection officers");
    console.log(items, total);
    
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getAllSalesReportsDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const validatedQuery = await ReportValidate.getAllOfficersSchema.validateAsync(req.query);


    const { page, limit, searchText } = validatedQuery;
    const centerId = req.user.centerId;

    const { items, total } = await ReportDAO.getAllSalesOfficerDAO(centerId, page, limit, searchText);

    console.log("Successfully fetched collection officers");
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getCollectionFarmersList = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.getCollectionFarmerListQuaryParmsSchema.validateAsync(req.query);
    const { id } = await ReportValidate.IdParmsSchema.validateAsync(req.params);

    const { page, limit, searchText, date } = validatedQuery;
    // const centerId = req.user.centerId;

    const { items, total } = await ReportDAO.getCollectionFarmerLisDao(id, page, limit, searchText, date);
    console.log("Successfully fetched collection farmer list ");
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection farmer list :", error);
    return res.status(500).json({ error: "An error occurred while fetching collection farmer list " });
  }
};


exports.getDailyReport = async (req, res) => {
  try {
    const { id, date } = await ReportValidate.dailyReportSchema.validateAsync(req.params);

    const result = await ReportDAO.dailyReportDao(id, date);

    if (result.length === 0) {
      return res.json({ message: "No news items found", data: result });
    }

    console.log("Successfully retrieved all collection center");
    res.json(result);
  } catch (err) {
    if (err.isJoi) {
      // Validation error
      console.error("Validation error:", err.details[0].message);
      return res.status(400).json({ error: err.details[0].message });
    }

    console.error("Error fetching news:", err);
    res.status(500).json({ error: "An error occurred while fetching news" });
  }
};


exports.getMonthlyReportOfficer = async (req, res) => {
  try {
    const { id, startDate, endDate } = await ReportValidate.monthlyReportSchema.validateAsync(req.params);

    const resultOfficer = await ReportDAO.getMonthlyReportOfficerDao(id, startDate, endDate);
    const resultDates = await ReportDAO.getMonthlyReportDao(id, startDate, endDate);


    if (resultOfficer.length === 0) {
      return res.json({ message: "No report items found", officer: resultOfficer[0], dates: resultDates });
    }

    console.log("Successfully retrieved all collection center");
    res.json({ officer: resultOfficer[0], dates: resultDates });
  } catch (err) {
    if (err.isJoi) {
      // Validation error
      console.error("Validation error:", err.details[0].message);
      return res.status(400).json({ error: err.details[0].message });
    }

    console.error("Error fetching report:", err);
    res.status(500).json({ error: "An error occurred while fetching news" });
  }
};

exports.getFarmerReport = async (req, res) => {
  try {
    const { id } = await ReportValidate.IdParmsSchema.validateAsync(req.params);

    const UserResult = await ReportDAO.getFarmerDetailsDao(id);
    const CropResult = await ReportDAO.getFarmerCropsDetailsDao(id);

    console.log(UserResult);

    if (UserResult.length === 0 || CropResult.length === 0) {
      return res.json({ message: "No report items found", status: false });
    }

    console.log("Successfully retrieved all collection center");
    res.json({ user: UserResult[0], crops: CropResult, status: true });
  } catch (err) {
    if (err.isJoi) {
      // Validation error
      console.error("Validation error:", err.details[0].message);
      return res.status(400).json({ error: err.details[0].message });
    }

    console.error("Error fetching report:", err);
    res.status(500).json({ error: "An error occurred while fetching news" });
  }
};


exports.getAllPayments = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {

    const user = req.user
    console.log(user);

    const validatedQuery = await ReportValidate.getAllPaymentsSchema.validateAsync(req.query);

    const companyId = req.user.companyId;
    const centerId = req.user.centerId;
    const { page, limit, fromDate, toDate, searchText, center } = validatedQuery;

    console.log(fromDate);
    console.log(limit);
    

    if (user.role === "Collection Center Manager") {
      // const officers = await ReportDAO.checkOfficersForSameIrmIdDao(user.userId);
      // console.log(officers);
      const { items, total } = await ReportDAO.getAllPaymentsForCCMDAO(
        companyId, page, limit, fromDate, toDate, searchText, centerId, user.userId
      );
      console.log('from ccm', items);
      return res.status(200).json({ items, total });
      
    } else {
      const { items, total } = await ReportDAO.getAllPaymentsDAO(
        companyId, page, limit, fromDate, toDate, searchText, center
      );
      console.log(items);
      return res.status(200).json({ items, total });
    }

    
  
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getAllCollection = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate query parameters      
    const validatedQuery = await ReportValidate.getAllCollectionSchema.validateAsync(req.query);

    const companyId = req.user.companyId;

    const { page, limit, fromDate, toDate, center, searchText} = validatedQuery;

    // Call the DAO to get all collection officers
    const { items, total } = await ReportDAO.getAllCollectionDAO(page, limit, fromDate, toDate, center, searchText, companyId);

    console.log('logging items', items);

    console.log("Successfully fetched collection officers");
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.downloadAllPayments = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {

    const user = req.user
    console.log(user);

    const companyId = req.user.companyId;
    const centerId = req.user.centerId;
    const validatedQuery = await ReportValidate.downloadAllPaymentsSchema.validateAsync(req.query);

    const {fromDate, toDate, center, searchText} = validatedQuery;
    let data;

    if (user.role === "Collection Center Manager") {
      data = await ReportDAO.downloadPaymentReportForCCM(
        fromDate,
        toDate,
        centerId,
        searchText,
        companyId,
        user.userId
      );
      console.log('ccm data', data);
      
    }else {
      data = await ReportDAO.downloadPaymentReport(
        fromDate,
        toDate,
        center,
        searchText,
        companyId
      );
    }

    
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
      { wch: 15 }, // Amount
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

    // return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.downloadAllCollections = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.downloadAllCollectionsSchema.validateAsync(req.query);

    const companyId = req.user.companyId;
    const {fromDate, toDate, center, searchText} = validatedQuery;

    const data = await ReportDAO.downloadCollectionReport(
      fromDate,
      toDate,
      center,
      searchText,
      companyId
    );

    // Format data for Excel
    const formattedData = data.flatMap(item => [
      {
        'Center Reg Code': item.RegCode || '',
        'Center Name': item.centerName || '',
        'Crop Name': item.cropNameEnglish || '',
        'VarietyName': item.varietyNameEnglish || '',
        'Quantity A (kg)': item.totalGradeAQuantity ?? 0.00,
        'Quantity B (kg)': item.totalGradeBQuantity ?? 0.00,
        'Quantity C (kg)': item.totalGradeCQuantity ?? 0.00,
        'Total (kg)': item.totalQuan ?? 0.00
      },

    ]);

    console.log(formattedData);

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    worksheet['!cols'] = [
      { wch: 25 }, // regCode
      { wch: 15 }, // centerName
      { wch: 20 }, // cropNameEnglish
      { wch: 25 }, // varietyNameEnglish
      { wch: 18 }, // gradeAquan
      { wch: 25 }, // gradeBquan
      { wch: 15 }, // gradeCquan
      { wch: 25 }, // totalQuan
    ];


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collection Template');

    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="Collection Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the file to the client
    res.send(excelBuffer);

    // return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getAllCenterPayments = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.getAllCenterPaymentsSchema.validateAsync(req.query);

    const { page, limit, fromDate, toDate, centerId, searchText } = validatedQuery;

    console.log(fromDate);
    console.log(limit);

    const { items, total } = await ReportDAO.getAllCenterPaymentsDAO(
         page, limit, fromDate, toDate, centerId, searchText, 
    );

    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.downloadAllCenterPayments = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.downloadAllCenterPaymentsSchema.validateAsync(req.query);

    const {fromDate, toDate, centerId, searchText} = validatedQuery;

    const data = await ReportDAO.downloadCenterPaymentReport(
      fromDate,
      toDate,
      centerId,
      searchText,

    );

    // Format data for Excel
    const formattedData = data.flatMap(item => [
      {
        'GRN': item.invNo,
        'Amount': item.totalAmount,
        'Center Reg Code': item.centerCode,
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
      { wch: 15 }, // Amount
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

    // return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getFarmerReportInvoice = async (req, res) => {
  try {
    console.log(req.params);
    const { invNo } = await ReportValidate.invNoParmsSchema.validateAsync(req.params);

    const UserResult = await ReportDAO.getFarmerInvoiceDetailsDao(invNo);
    const CropResult = await ReportDAO.getFarmerCropsInvoiceDetailsDao(invNo);

    console.log(UserResult);

    if (UserResult.length === 0 || CropResult.length === 0) {
      return res.json({ message: "No report items found", status: false });
    }

    console.log("Successfully retrieved all collection center");
    res.json({ user: UserResult[0], crops: CropResult, status: true });
  } catch (err) {
    if (err.isJoi) {
      // Validation error
      console.error("Validation error:", err.details[0].message);
      return res.status(400).json({ error: err.details[0].message });
    }

    console.error("Error fetching report:", err);
    res.status(500).json({ error: "An error occurred while fetching news" });
  }
};



