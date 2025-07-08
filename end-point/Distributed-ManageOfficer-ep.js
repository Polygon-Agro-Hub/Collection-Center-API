const ManageOfficerValidate = require('../validations/Distributed-ManageOfficers-validation')
const ManageOfficerDAO = require('../dao/Distributed-ManageOfficers-dao')
const bcrypt = require("bcryptjs");
const uploadFileToS3 = require("../middlewares/s3upload");
const deleteFromS3 = require("../middlewares/s3delete");

exports.getAllOfficers = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Request received at: ${fullUrl}`);
  
  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);

    const centerId = req.user.distributedCenterId;

    const { page, limit, status, role, searchText } = validatedQuery;

    // Call the DAO to get all collection officers
    const { items, total } = await ManageOfficerDAO.getAllOfficersDAO(centerId, page, limit, status, role, searchText);

    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getAllOfficersForDCH = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Request received at: ${fullUrl}`);
  
  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);
    const companyId = req.user.companyId;
    const { page, limit, status, role, searchText, center } = validatedQuery;
    const { items, total } = await ManageOfficerDAO.getAllOfficersForDCHDAO(companyId, page, limit, status, role, searchText, center);
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getAllCompanyNames = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const results = await ManageOfficerDAO.getAllCompanyNamesDao();

    res.status(200).json(results);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error retrieving district reports:", error);
    return res.status(500).json({ error: "An error occurred while fetching the reports" });
  }
};


exports.getDCHOwnCenters = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const companyId = req.user.companyId;
    const result = await ManageOfficerDAO.getDCHOwnCenters(companyId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};