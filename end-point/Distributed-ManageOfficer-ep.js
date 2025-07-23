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

// exports.getDCHOwnCenters = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log('fullUrl', fullUrl)
//   try {
//     const companyId = req.user.companyId;
//     console.log('companyId', companyId)
//     const result = await ManageOfficerDAO.getDCHOwnCenters(companyId);
//     console.log('result', result)
//     return res.status(200).json(result);
//   } catch (error) {
//     if (error.isJoi) {
//       return res.status(400).json({ error: error.details[0].message });
//     }
//     return res.status(500).json({ error: "An error occurred while fetching collection officers" });
//   }
// };

exports.getDistributionCenterManager = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl)
  try {
    // const { id } = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);
    const { id } = req.params
    const companyId = req.user.companyId

    console.log('id', id, 'companyId', companyId)
    const result = await ManageOfficerDAO.getDistributionCenterManagerDao(companyId, id);
    console.log('result',result)
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getForCreateId = async (req, res) => {
  try {

    const { role } = await ManageOfficerValidate.getRoleShema.validateAsync(req.params);
    const results = await ManageOfficerDAO.getForCreateIdDao(role);

    if (results.length === 0) {
      return res.json({ result: { empId: "00001" }, status: true })
    }

    res.status(200).json({ result: results[0], status: true });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    console.error("Error executing query:", err);
    res.status(500).send("An error occurred while fetching data.");
  }
};

exports.createOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const officerData = JSON.parse(req.body.officerData);
    console.log('officerData', officerData);
    const checkUserExist = await ManageOfficerDAO.checkExistOfficersDao(officerData.nic);
    if (checkUserExist) {
      return res.json({ message: "This NIC Number already exist.", status: false });
    }

    const checkEmailExist = await ManageOfficerDAO.checkExistEmailsDao(officerData.email);
    if (checkEmailExist) {
      return res.json({ message: "This Email already exist.", status: false });
    }

    const checkPhoneExist = await ManageOfficerDAO.checkExistPhoneDao(officerData.phoneNumber01);
    if (checkPhoneExist) {
      return res.json({ message: "This Phone Number - 1 already exist.", status: false });
    }

    if (officerData.phoneNumber02) {
      console.log('phonenumber 2')
      const checkPhone2Exist = await ManageOfficerDAO.checkExistPhone2Dao(officerData.phoneNumber02);
      if (checkPhone2Exist) {
        return res.json({ message: "This Phone Number - 2 already exist.", status: false });
      }
    }

    const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    const managerID = req.user.userId;

    let profileImageUrl = null;

if (req.body.file && req.body.file.includes("base64,")) {
  try {
    const base64String = req.body.file.split(",")[1]; // Extract Base64 content
    const match = req.body.file.match(/data:(.*?);base64,/);

    if (!match) {
      return res.status(400).json({ error: "Invalid image format." });
    }

    const mimeType = match[1];
    const fileBuffer = Buffer.from(base64String, "base64");
    const fileExtension = mimeType.split("/")[1];
    const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;

    profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "distributionfficer/image");
  } catch (err) {
    console.error("Error processing image:", err);
    return res.status(400).json({ error: "Error decoding image." });
  }
}


    const lastId = await ManageOfficerDAO.getCCIDforCreateEmpIdDao(officerData.jobRole)

    const result = await ManageOfficerDAO.createCollectionOfficerPersonal(officerData, centerId, companyId, managerID, profileImageUrl,lastId);

    if (result.affectedRows === 0) {
      return res.json({ message: "User not found or no changes were made.", status: false });
    }

    return res.status(201).json({ message: "Collection Officer created successfully", status: true });
  } catch (error) {
    if (error.isJoi) {

      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error creating collection officer:", error);
    return res.status(500).json({ error: "An error occurred while creating the collection officer" });
  }
};