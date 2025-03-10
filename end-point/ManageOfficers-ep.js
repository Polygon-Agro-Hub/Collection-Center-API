const ManageOfficerValidate = require('../validations/ManageOfficer-validation')
const ManageOfficerDAO = require('../dao/ManageOfficer-dao')
const bcrypt = require("bcryptjs");
const uploadFileToS3 = require("../middlewares/s3upload");
const deleteFromS3 = require("../middlewares/s3delete");



exports.getAllCollectionCenter = async (req, res) => {
  try {
    const result = await ManageOfficerDAO.GetAllCenterDAO()

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
  console.log(fullUrl);

  try {
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const officerData = JSON.parse(req.body.officerData);

    const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    const managerID = req.user.userId;

    const base64String = req.body.file.split(",")[1]; // Extract the Base64 content
    const mimeType = req.body.file.match(/data:(.*?);base64,/)[1]; // Extract MIME type
    const fileBuffer = Buffer.from(base64String, "base64"); // Decode Base64 to buffer

    const fileExtension = mimeType.split("/")[1]; // Extract file extension from MIME type
    const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;

    const profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "collectionofficer/image");

    const result = await ManageOfficerDAO.createCollectionOfficerPersonal(officerData, centerId, companyId, managerID, profileImageUrl);

    if (result.affectedRows === 0) {
      return res.json({ message: "User not found or no changes were made.", status: false });
    }

    console.log("Collection Officer created successfully");
    return res.status(201).json({ message: "Collection Officer created successfully", status: true });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error creating collection officer:", error);
    return res.status(500).json({ error: "An error occurred while creating the collection officer" });
  }
};

exports.getManagerIdByCenterId = async (req, res) => {
  try {
    const { centerId } = await ManageOfficerValidate.getCenterIdShema.validateAsync(req.params);
    const results = await ManageOfficerDAO.getManagerIdByCenterIdDAO(centerId);

    res.status(200).json({ result: results, status: true });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    console.error("Error executing query:", err);
    res.status(500).send("An error occurred while fetching data.");
  }
};


exports.getAllOfficers = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);

    const centerId = req.user.centerId;

    const { page, limit, status, role, searchText } = validatedQuery;

    // Call the DAO to get all collection officers
    const { items, total } = await ManageOfficerDAO.getAllOfficersDAO(centerId, page, limit, status, role, searchText);

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


exports.getAllCompanyNames = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const results = await ManageOfficerDAO.getAllCompanyNamesDao();

    console.log("Successfully retrieved reports");
    res.status(200).json(results);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error retrieving district reports:", error);
    return res.status(500).json({ error: "An error occurred while fetching the reports" });
  }
};


exports.deleteOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {

    const { id } = await ManageOfficerValidate.deleteOfficerSchema.validateAsync(req.params);
    const results = await ManageOfficerDAO.DeleteOfficerDao(id);

    console.log("Successfully Delete officer");
    if (results.affectedRows > 0) {
      res.status(200).json({ results: results, status: true });
    } else {
      res.json({ results: results, status: false });

    }
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message, status: false });
    }

    console.error("Error delete  officer:", error);
    return res.status(500).json({ error: "An error occurred while delete officer" });
  }
};


exports.UpdateStatusAndSendPassword = async (req, res) => {
  try {
    const { id, status } = req.params;

    if (!id || !status) {
      return res.status(400).json({ message: 'ID and status are required.', status: false });
    }
    const officerData = await ManageOfficerDAO.getCollectionOfficerEmailDao(id);
    if (!officerData) {
      return res.status(404).json({ message: 'Collection officer not found.', status: false });
    }
    const { email, firstNameEnglish, empId, Existstatus } = officerData;


    if (Existstatus === status) {
      return res.json({ message: 'Status already updated.', status: false });
    }


    if (status === 'Approved') {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, parseInt(process.env.SALT_ROUNDS));

      const updateResult = await ManageOfficerDAO.UpdateCollectionOfficerStatusAndPasswordDao({
        id,
        status,
        password: hashedPassword,
      });

      if (updateResult.affectedRows === 0) {
        return res.status(400).json({ message: 'Failed to update status and password.', status: false });
      }

      const emailResult = await ManageOfficerDAO.SendGeneratedPasswordDao(email, generatedPassword, empId, firstNameEnglish);

      if (!emailResult.success) {
        return res.status(500).json({ message: 'Failed to send password email.', error: emailResult.error });
      }
    } else {
      const updateResult = await ManageOfficerDAO.UpdateCollectionOfficerStatusAndPasswordDao({
        id,
        status,
        password: null,
      });
    }

    // Return success response with empId and email
    res.status(200).json({
      message: 'Status updated and password sent successfully.',
      status: true,
      data: {
        empId,
        email,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred.', error });
  }
};


exports.getOfficerById = async (req, res) => {
  try {
    // const id = req.params.id;
    const { id } = await ManageOfficerValidate.getOfficerByIdSchema.validateAsync(req.params);
    const officerData = await ManageOfficerDAO.getOfficerByIdDAO(id);

    if (!officerData) {
      return res.status(404).json({ error: "Collection Officer not found" });
    }

    console.log("Successfully fetched collection officer, company, and bank details");
    res.json({ officerData });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    console.error("Error executing query:", err);
    res.status(500).send("An error occurred while fetching data.");
  }
};


exports.updateCollectionOfficer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const officerData = JSON.parse(req.body.officerData)

    await deleteFromS3(officerData.previousImage);
    const base64String = req.body.file.split(",")[1]; // Extract the Base64 content
    const mimeType = req.body.file.match(/data:(.*?);base64,/)[1]; // Extract MIME type
    const fileBuffer = Buffer.from(base64String, "base64"); // Decode Base64 to buffer

    const fileExtension = mimeType.split("/")[1]; // Extract file extension from MIME type
    const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;

    const profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "collectionofficer/image");

    const result = await ManageOfficerDAO.updateOfficerDetails(id, officerData, profileImageUrl);

    res.json({ message: 'Collection officer details updated successfully' });
  } catch (err) {
    console.error('Error updating collection officer details:', err);
    res.status(500).json({ error: 'Failed to update collection officer details' });
  }
};

exports.disclaimOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ManageOfficerDAO.disclaimOfficerDetailsDao(id);

    res.json({ message: 'Collection officer details updated successfully' });
  } catch (err) {
    console.error('Error updating collection officer details:', err);
    res.status(500).json({ error: 'Failed to update collection officer details' });
  }
};


exports.getOfficerByEmpId = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const { id } = await ManageOfficerValidate.getparmasEmpIdSchema.validateAsync(req.params);

    const result = await ManageOfficerDAO.getOfficerByEmpIdDao(id)
    if (result.length === 0) {
      return res.json({ message: "no data found!", status: false })
    }

    if (result[0].claimStatus === 1) {
      return res.json({ message: "Officer have center", status: true, data: result[0] })
    }

    console.log("Successfully fetched officer");
    res.status(200).json({ message: "Data found!", status: true, data: result[0] });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer" });
  }
}


exports.claimOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { id } = await ManageOfficerValidate.getOfficerByIdSchema.validateAsync(req.body);
    const userId = req.user.userId;
    const centerId = req.user.centerId;

    const results = await ManageOfficerDAO.claimOfficerDao(id, userId, centerId)

    if (results.affectedRows > 0) {
      res.status(200).json({ results: results, status: true });
    } else {
      res.json({ results: results, status: false });

    };
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer" });
  }
}


exports.getTargetDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {

    const { id } = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);

    const resultTarget = await ManageOfficerDAO.getTargetDetailsToPassDao(id);
    const resultOfficer = await ManageOfficerDAO.getOfficersToPassTargetDao(resultTarget.officerId, resultTarget.companyId, resultTarget.centerId);

    console.log("Successfully retrieved target crop verity");
    res.status(200).json({ resultTarget, resultOfficer });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.editOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const target = await ManageOfficerValidate.PassTargetValidationSchema.validateAsync(req.body);

    const targetResult = await ManageOfficerDAO.getTargetDetailsToPassDao(target.target);
    const passingOfficer = await ManageOfficerDAO.getPassingOfficerDao(targetResult, target.officerId);

    let resultUpdate
    let result

    const amount = targetResult.target - target.amount;


    if (passingOfficer.length === 0) {
      // console.log(targetResult.targetId, targetResult.cropId, target.officerId, targetResult.grade, parseFloat(target.amount));
      resultUpdate = await ManageOfficerDAO.updateTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        result = await ManageOfficerDAO.AssignOfficerTargetDao(targetResult.targetId, targetResult.cropId, target.officerId, targetResult.grade, parseFloat(target.amount));
      } else {
        return res.json({ status: false, message: "Target Passing Unsccessfull!" });
      }
    } else {
      resultUpdate = await ManageOfficerDAO.updateTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        const newAmount = parseFloat(passingOfficer[0].target) + target.amount;
        result = await ManageOfficerDAO.updateTargetDao(passingOfficer[0].id, newAmount);
      } else {
        return res.json({ status: false, message: "Target Passing Unsccessfull!" });
      }
    }

    console.log("Successfully passing target");
    res.status(200).json({ status: true, message: "Target Passing successfull!" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error passing target:", error);
    return res.status(500).json({ error: "An error occurred while passing target" });
  }
};



exports.getAllOfficersForCCH = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);

    const companyId = req.user.companyId;

    const { page, limit, status, role, searchText, center } = validatedQuery;

    // Call the DAO to get all collection officers
    const { items, total } = await ManageOfficerDAO.getAllOfficersForCCHDAO(companyId, page, limit, status, role, searchText, center);

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


exports.getCCHOwnCenters = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate query parameters      
    // const validatedQuery = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);

    const companyId = req.user.companyId;

    // const { page, limit, status, role, searchText } = validatedQuery;

    // Call the DAO to get all collection officers
    const result = await ManageOfficerDAO.getCCHOwnCenters(companyId);

    console.log("Successfully fetched collection officers");
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getCenterManager = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate q[uery parameters      
    const { id } = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);

    const companyId = req.user.companyId
    // Call the DAO to get all collection officers
    const result = await ManageOfficerDAO.getCenterManagerDao(companyId, id);

    console.log("Successfully fetched collection officers");
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};



exports.CCHcreateOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const officerData = JSON.parse(req.body.officerData);

    // const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    // const managerID = req.user.userId;

    const base64String = req.body.file.split(",")[1]; // Extract the Base64 content
    const mimeType = req.body.file.match(/data:(.*?);base64,/)[1]; // Extract MIME type
    const fileBuffer = Buffer.from(base64String, "base64"); // Decode Base64 to buffer

    const fileExtension = mimeType.split("/")[1]; // Extract file extension from MIME type
    const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;

    const profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "collectionofficer/image");

    const result = await ManageOfficerDAO.createCollectionOfficerPersonalCCH(officerData, companyId, profileImageUrl);

    if (result.affectedRows === 0) {
      return res.json({ message: "User not found or no changes were made.", status: false });
    }

    console.log("Collection Officer created successfully");
    return res.status(201).json({ message: "Collection Officer created successfully", status: true });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error creating collection officer:", error);
    return res.status(500).json({ error: "An error occurred while creating the collection officer" });
  }
};


exports.CCHupdateCollectionOfficer = async (req, res) => {
  try {
    const { id } = req.params;
    let result;

    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const officerData = JSON.parse(req.body.officerData)
    console.log(officerData);

    console.log("req file:",req.body.file);
    if (req.body.file === "null") {      
      result = await ManageOfficerDAO.CCHupdateOfficerDetails(id, officerData, officerData.previousImage);

    } else {
      const base64String = req.body.file.split(",")[1]; // Extract the Base64 content
      const mimeType = req.body.file.match(/data:(.*?);base64,/)[1]; // Extract MIME type
      const fileBuffer = Buffer.from(base64String, "base64"); // Decode Base64 to buffer

      const fileExtension = mimeType.split("/")[1]; // Extract file extension from MIME type
      const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;

      const profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "collectionofficer/image");
      await deleteFromS3(officerData.previousImage);

      result = await ManageOfficerDAO.CCHupdateOfficerDetails(id, officerData, profileImageUrl);

    }

    console.log(result);

    res.json({ message: 'Collection officer details updated successfully' });
  } catch (err) {
    console.error('Error updating collection officer details:', err);
    res.status(500).json({ error: 'Failed to update collection officer details' });
  }
};
