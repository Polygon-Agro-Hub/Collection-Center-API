const ReportDAO = require('../dao/Report-dao')
const ReportValidate = require('../validations/Report-validation')



exports.getAllCollectionReportsDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const validatedQuery = await ReportValidate.getAllOfficersSchema.validateAsync(req.query);
    

    const { page, limit, searchText } = validatedQuery;
    const centerId = req.user.centerId;

    const { items, total } = await ReportDAO.getAllOfficersDAO(centerId, page, limit, searchText);
    



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

    


    if (UserResult.length === 0 || CropResult.length === 0) {
      return res.json({ message: "No report items found", status: false });
    }

    console.log("Successfully retrieved all collection center");
    res.json({ user: UserResult[0], crops:CropResult, status: true });
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



