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
    res.json(result);
  } catch (err) {
    if (err.isJoi) {
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
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const officerData = JSON.parse(req.body.officerData);
    const checkUserExist = await ManageOfficerDAO.checkExistOfficersDao(officerData.nic);
    if (checkUserExist) {
      return res.json({ message: "This NIC Number already exist.", status: false });
    }
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

    return res.status(201).json({ message: "Collection Officer created successfully", status: true });
  } catch (error) {
    if (error.isJoi) {

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
  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);

    const centerId = req.user.centerId;

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


exports.deleteOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {

    const { id } = await ManageOfficerValidate.deleteOfficerSchema.validateAsync(req.params);
    const officerData = await ManageOfficerDAO.getOfficerByIdDAO(id);
    console.log('officerData', officerData);
    await deleteFromS3(officerData.collectionOfficer.image);
    await deleteFromS3(officerData.collectionOfficer.QRcode);


    const results = await ManageOfficerDAO.DeleteOfficerDao(id);

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
    const { id } = await ManageOfficerValidate.getOfficerByIdSchema.validateAsync(req.params);
    const officerData = await ManageOfficerDAO.getOfficerByIdDAO(id);

    if (!officerData) {
      return res.status(404).json({ error: "Collection Officer not found" });
    }

    console.log(officerData);

    // If image URL exists, fetch and convert to Base64
    // if (officerData.collectionOfficer.image) {
    //   try {
    //     const imageUrl = officerData.collectionOfficer.image;

    //     // Add validation to ensure URL is not undefined/null
    //     if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
    //       console.log('Image URL is invalid:', imageUrl);
    //       officerData.collectionOfficer.base64Image = null;
    //     } else {
    //       console.log('Fetching image from URL:', imageUrl);

    //       // Fetch the image using native fetch (Node 18+)
    //       const response = await fetch(imageUrl);

    //       // Check if request was successful
    //       if (!response.ok) {
    //         throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    //       }

    //       // Get image as ArrayBuffer
    //       const buffer = await response.arrayBuffer();

    //       // Convert to Base64
    //       const base64Image = Buffer.from(buffer).toString('base64');

    //       // Get MIME type from response headers (fallback to 'image/jpeg')
    //       const mimeType = response.headers.get('content-type') || 'image/jpeg';

    //       // Add Base64 data URL to officerData
    //       officerData.collectionOfficer.base64Image = `data:${mimeType};base64,${base64Image}`;
    //       console.log('Successfully converted image to base64');
    //       console.log(officerData);
    //     }
    //   } catch (imageError) {
    //     console.error('Error converting image to Base64:', imageError);
    //     // Set base64Image to null if conversion fails
    //     officerData.collectionOfficer.base64Image = null;
    //   }
    // } else {
    //   // No image URL provided
    //   officerData.collectionOfficer.base64Image = null;
    // }

    const responseData = { officerData };

    // Convert to JSON string
    const jsonString = JSON.stringify(responseData);

    // Get byte size
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

    console.log(`Response size: ${sizeInBytes} bytes`);

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
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`${fullUrl}`);
  try {
    const { id } = req.params;
    console.log(id);

    // if (!req.body.file) {
    //   return res.status(400).json({ error: "No file uploaded" });
    // }

    console.log(req.body.file);

    const officerData = JSON.parse(req.body.officerData)
    console.log('this is', officerData.nic)

    const existingNic = await ManageOfficerDAO.getExistingNic(officerData.nic, id);
    if (existingNic) {
      console.log('exisit')
      return res.status(409).json({
        status: false,
        message: "nic already in use."
      });
    }

    const existingEmail = await ManageOfficerDAO.getExistingEmail(officerData.email, id);
    if (existingEmail) {
      console.log('Email exists');
      return res.status(410).json({ status: false, message: "Email already exists for another collection officer" });
    }

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
  try {
    const { id } = await ManageOfficerValidate.getparmasEmpIdSchema.validateAsync(req.params);

    const result = await ManageOfficerDAO.getOfficerByEmpIdDao(id)
    if (result.length === 0) {
      return res.json({ message: "no data found!", status: false })
    }

    if (result[0].claimStatus === 1) {
      return res.json({ message: "Officer have center", status: true, data: result[0] })
    }

    res.status(200).json({ message: "Data found!", status: true, data: result[0] });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer" });
  }
}


exports.claimOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
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
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer" });
  }
}


exports.getTargetDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {

    const { id } = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);

    const resultTarget = await ManageOfficerDAO.getTargetDetailsToPassDao(id);
    const resultOfficer = await ManageOfficerDAO.getOfficersToPassTargetDao(resultTarget.officerId, resultTarget.companyId, resultTarget.centerId);

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
  try {
    const target = await ManageOfficerValidate.PassTargetValidationSchema.validateAsync(req.body);

    const targetResult = await ManageOfficerDAO.getTargetDetailsToPassDao(target.target);
    const passingOfficer = await ManageOfficerDAO.getPassingOfficerDao(targetResult, target.officerId);

    let resultUpdate
    let result

    const amount = targetResult.target - target.amount;


    if (passingOfficer.length === 0) {
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
  try {
    // Validate query parameters      
    const validatedQuery = await ManageOfficerValidate.getAllOfficersSchema.validateAsync(req.query);
    const companyId = req.user.companyId;
    const { page, limit, status, role, searchText, center } = validatedQuery;
    const { items, total } = await ManageOfficerDAO.getAllOfficersForCCHDAO(companyId, page, limit, status, role, searchText, center);
    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getCCHOwnCenters = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const companyId = req.user.companyId;
    const result = await ManageOfficerDAO.getCCHOwnCenters(companyId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getCenterManager = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const { id } = await ManageOfficerValidate.IdValidationSchema.validateAsync(req.params);
    const companyId = req.user.companyId
    const result = await ManageOfficerDAO.getCenterManagerDao(companyId, id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};



exports.CCHcreateOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const officerData = JSON.parse(req.body.officerData);
    const companyId = req.user.companyId;
    const checkUserExist = await ManageOfficerDAO.checkExistOfficersDao(officerData.nic);
    if (checkUserExist) {
      return res.json({ message: "This NIC Number already exist.", status: false });
    }

    let profileImageUrl = null;

    if (req.body.file !== 'null') {
      const base64String = req.body.file.split(",")[1]; // Extract the Base64 content
      const mimeType = req.body.file.match(/data:(.*?);base64,/)[1]; // Extract MIME type
      const fileBuffer = Buffer.from(base64String, "base64"); // Decode Base64 to buffer
      const fileExtension = mimeType.split("/")[1]; // Extract file extension from MIME type
      const fileName = `${officerData.firstNameEnglish}_${officerData.lastNameEnglish}.${fileExtension}`;
      profileImageUrl = await uploadFileToS3(fileBuffer, fileName, "collectionofficer/image");
    }


    const result = await ManageOfficerDAO.createCollectionOfficerPersonalCCH(officerData, companyId, profileImageUrl);

    if (result.affectedRows === 0) {
      return res.json({ message: "User not found or no changes were made.", status: false });
    }

    if (officerData.jobRole === "Driver") {

      const driverData = JSON.parse(req.body.driverData);
      const licFrontbase64String = req.body.licFront.split(",")[1]; // Extract the Base64 content
      const licFrontfileBuffer = Buffer.from(licFrontbase64String, "base64"); // Decode Base64 to buffer
      const licFrontfileName = `${driverData.licFrontName}`;
      const licFrontImageUrl = await uploadFileToS3(licFrontfileBuffer, licFrontfileName, "vehicleregistration/licFrontImg");

      //license back
      const licBackbase64String = req.body.licBack.split(",")[1]; // Extract the Base64 content
      const licBackfileBuffer = Buffer.from(licBackbase64String, "base64"); // Decode Base64 to buffer
      const licBackfileName = `${driverData.licBackName}`;
      const licBackImageUrl = await uploadFileToS3(licBackfileBuffer, licBackfileName, "vehicleregistration/licBackImg");

      //insurance front
      const insFrontbase64String = req.body.insFront.split(",")[1]; // Extract the Base64 content
      const insFrontfileBuffer = Buffer.from(insFrontbase64String, "base64"); // Decode Base64 to buffer
      const insFrontfileName = `${driverData.insFrontName}`;
      const insFrontImageUrl = await uploadFileToS3(insFrontfileBuffer, insFrontfileName, "vehicleregistration/insFrontImg");

      //insurance back
      const insBackbase64String = req.body.insBack.split(",")[1]; // Extract the Base64 content
      const insBackfileBuffer = Buffer.from(insBackbase64String, "base64"); // Decode Base64 to buffer
      const insBackfileName = `${driverData.insBackName}`;
      const insBackImageUrl = await uploadFileToS3(insBackfileBuffer, insBackfileName, "vehicleregistration/insBackImg");

      //vehicle front
      const vehicleFrontbase64String = req.body.vehiFront.split(",")[1]; // Extract the Base64 content
      const vehicleFrontfileBuffer = Buffer.from(vehicleFrontbase64String, "base64"); // Decode Base64 to buffer
      const vehicleFrontfileName = `${driverData.vFrontName}`;
      const vehicleFrontImageUrl = await uploadFileToS3(vehicleFrontfileBuffer, vehicleFrontfileName, "vehicleregistration/vehFrontImg");

      //vehicle back
      const vehicleBackbase64String = req.body.vehiBack.split(",")[1]; // Extract the Base64 content
      const vehicleBackfileBuffer = Buffer.from(vehicleBackbase64String, "base64"); // Decode Base64 to buffer
      const vehicleBackfileName = `${driverData.vBackName}`;
      const vehicleBackImageUrl = await uploadFileToS3(vehicleBackfileBuffer, vehicleBackfileName, "vehicleregistration/vehBackImg");

      //vehicle sideA
      const vehicleSideAbase64String = req.body.vehiSideA.split(",")[1]; // Extract the Base64 content
      const vehicleSideAfileBuffer = Buffer.from(vehicleSideAbase64String, "base64"); // Decode Base64 to buffer
      const vehicleSideAfileName = `${driverData.vSideAName}`;
      const vehicleSideAImageUrl = await uploadFileToS3(vehicleSideAfileBuffer, vehicleSideAfileName, "vehicleregistration/vehSideImgA");

      //vehicle sideB
      const vehicleSideBbase64String = req.body.vehiSideB.split(",")[1]; // Extract the Base64 content
      const vehicleSideBfileBuffer = Buffer.from(vehicleSideBbase64String, "base64"); // Decode Base64 to buffer
      const vehicleSideBfileName = `${driverData.vSideBName}`;
      const vehicleSideBImageUrl = await uploadFileToS3(vehicleSideBfileBuffer, vehicleSideBfileName, "vehicleregistration/vehSideImgB");

      const Driverresult = await ManageOfficerDAO.vehicleRegisterDao(result.insertId, driverData, licFrontImageUrl, licBackImageUrl, insFrontImageUrl, insBackImageUrl, vehicleFrontImageUrl, vehicleBackImageUrl, vehicleSideAImageUrl, vehicleSideBImageUrl);
      if (Driverresult.affectedRows === 0) {
        const deleteUser = await ManageOfficerDAO.DeleteOfficerDao(result.insertId);
        return res.json({ message: "Driver Onbord Error Occor. Pleace Try again later!", status: false });
      }

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


exports.CCHupdateCollectionOfficer = async (req, res) => {
  try {

    console.log(req.body);
    const { id } = req.params;

    let result;
    if (!req.body.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const officerData = JSON.parse(req.body.officerData);
    const nic = officerData.nic;
    const email = officerData.email;
    console.log(officerData);
    const existingNic = await ManageOfficerDAO.getExistingNic(nic, id); // assuming you'll check by NIC and exclude by ID
    console.log('starts functions')
    if (existingNic) {
      console.log('NIC exists');
      return res.status(409).json({ status: false, message: "NIC already exists for another collection officer" });
    }
    const existingEmail = await ManageOfficerDAO.getExistingEmail(email, id);
    if (existingEmail) {
      console.log('Email exists');
      return res.status(410).json({ status: false, message: "Email already exists for another collection officer" });
    }

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

    if (result.affectedRows > 0 && officerData.jobRole === 'Driver') {
      const driverData = JSON.parse(req.body.driverData)

      if (req.body.licFront !== 'null') {
        //license front
        await deleteFromS3(driverData.licFrontImg);
        const licFrontbase64String = req.body.licFront.split(",")[1]; // Extract the Base64 content
        const licFrontfileBuffer = Buffer.from(licFrontbase64String, "base64"); // Decode Base64 to buffer
        const licFrontfileName = `${driverData.licFrontName}`;
        driverData.licFrontImg = await uploadFileToS3(licFrontfileBuffer, licFrontfileName, "vehicleregistration/licFrontImg");

      }

      if (req.body.licBack !== 'null') {
        //license back
        await deleteFromS3(driverData.licBackImg);
        const licBackbase64String = req.body.licBack.split(",")[1]; // Extract the Base64 content
        const licBackfileBuffer = Buffer.from(licBackbase64String, "base64"); // Decode Base64 to buffer
        const licBackfileName = `${driverData.licBackName}`;
        driverData.licBackImg = await uploadFileToS3(licBackfileBuffer, licBackfileName, "vehicleregistration/licBackImg");
      }



      if (req.body.insFront !== 'null') {
        //insurance front
        await deleteFromS3(driverData.insFrontImg);
        const insFrontbase64String = req.body.insFront.split(",")[1]; // Extract the Base64 content
        const insFrontfileBuffer = Buffer.from(insFrontbase64String, "base64"); // Decode Base64 to buffer
        const insFrontfileName = `${driverData.insFrontName}`;
        driverData.insFrontImg = await uploadFileToS3(insFrontfileBuffer, insFrontfileName, "vehicleregistration/insFrontImg");
      }

      if (req.body.insBack !== 'null') {
        //insurance back
        await deleteFromS3(driverData.insBackImg);
        const insBackbase64String = req.body.insBack.split(",")[1]; // Extract the Base64 content
        const insBackfileBuffer = Buffer.from(insBackbase64String, "base64"); // Decode Base64 to buffer
        const insBackfileName = `${driverData.insBackName}`;
        driverData.insBackImg = await uploadFileToS3(insBackfileBuffer, insBackfileName, "vehicleregistration/insBackImg");
      }

      if (req.body.vehiFront !== 'null') {
        //vehicle front
        await deleteFromS3(driverData.vehFrontImg);
        const vehicleFrontbase64String = req.body.vehiFront.split(",")[1]; // Extract the Base64 content
        const vehicleFrontfileBuffer = Buffer.from(vehicleFrontbase64String, "base64"); // Decode Base64 to buffer
        const vehicleFrontfileName = `${driverData.vFrontName}`;
        driverData.vehFrontImg = await uploadFileToS3(vehicleFrontfileBuffer, vehicleFrontfileName, "vehicleregistration/vehFrontImg");
      }

      if (req.body.vehiBack !== 'null') {
        //vehicle back
        await deleteFromS3(driverData.vehBackImg);
        const vehicleBackbase64String = req.body.vehiBack.split(",")[1]; // Extract the Base64 content
        const vehicleBackfileBuffer = Buffer.from(vehicleBackbase64String, "base64"); // Decode Base64 to buffer
        const vehicleBackfileName = `${driverData.vBackName}`;
        driverData.vehBackImg = await uploadFileToS3(vehicleBackfileBuffer, vehicleBackfileName, "vehicleregistration/vehBackImg");
      }

      if (req.body.vehiSideA !== 'null') {
        //vehicle sideA
        await deleteFromS3(driverData.vehSideImgA);
        const vehicleSideAbase64String = req.body.vehiSideA.split(",")[1]; // Extract the Base64 content
        const vehicleSideAfileBuffer = Buffer.from(vehicleSideAbase64String, "base64"); // Decode Base64 to buffer
        const vehicleSideAfileName = `${driverData.vSideAName}`;
        driverData.vehSideImgA = await uploadFileToS3(vehicleSideAfileBuffer, vehicleSideAfileName, "vehicleregistration/vehSideImgA");

      }

      if (req.body.vehiSideB !== 'null') {
        //vehicle sideB
        await deleteFromS3(driverData.vehSideImgB);
        const vehicleSideBbase64String = req.body.vehiSideB.split(",")[1]; // Extract the Base64 content
        const vehicleSideBfileBuffer = Buffer.from(vehicleSideBbase64String, "base64"); // Decode Base64 to buffer
        const vehicleSideBfileName = `${driverData.vSideBName}`;
        driverData.vehSideImgB = await uploadFileToS3(vehicleSideBfileBuffer, vehicleSideBfileName, "vehicleregistration/vehSideImgB");

      }

      const updateDriver = await ManageOfficerDAO.updateVehicleRegistratinDao(driverData);

    }

    res.json({ message: 'Collection officer details updated successfully' });
  } catch (err) {
    console.error('Error updating collection officer details:', err);
    res.status(500).json({ error: 'Failed to update collection officer details' });
  }
};

// exports.CCHupdateCollectionOfficer = async (req, res) => {
//   const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
//   console.log(fullUrl);
//   try {
//     const { id } = req.params;
//     const { nic } = req.body;

//     if (!req.body.file) {
//       return res.status(400).json({ status: false, message: "No file uploaded" });
//     }

//     // Check for duplicate NIC (excluding current officer)
//     const existingOfficer = await ManageOfficerDAO.getExistingEmail(nic); // assuming you'll check by NIC and exclude by ID
//     console.log('starts functions')
//     if (existingOfficer) {
//       console.log('NIC exists');
//       return res.status(409).json({ status: false, message: "NIC already exists for another collection officer" });
//     }else {
//       return res.status(409).json({ status: true, message: "this is working" });
//     }

//     // TODO: Add your update logic here if needed
//     // Example: await ManageOfficerDAO.updateOfficer(id, req.body);

//     // return res.status(200).json({ status: true, message: "Collection officer details updated successfully" });
//   } catch (err) {
//     console.error('Error updating collection officer details:', err);
//     return res.status(500).json({ status: false, message: "Failed to update collection officer details" });
//   }
// };


exports.getProfileImageBase64ById = async (req, res) => {
  try {
    // const { id } = await ManageOfficerValidate.getProfileImageBase64ByIdSchema.validateAsync(req.params);
    const { id } = req.params;
    const {results} = await ManageOfficerDAO.ProfileImageBase64ByIdDAO(id);

    if (!results) {
      return res.status(404).json({ error: "Collection Officer not found" });
    }

    console.log(results);
    const image = results[0].image
    console.log(image);
    let profileImageBase64 = '';

    // If image URL exists, fetch and convert to Base64
    if (image) {
      try {
        const imageUrl = image;

        // Add validation to ensure URL is not undefined/null
        if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
          console.log('Image URL is invalid:', imageUrl);
          profileImageBase64 = null;
        } else {
          console.log('Fetching image from URL:', imageUrl);

          // Fetch the image using native fetch (Node 18+)
          const response = await fetch(imageUrl);

          // Check if request was successful
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }

          // Get image as ArrayBuffer
          const buffer = await response.arrayBuffer();

          // Convert to Base64
          const base64Image = Buffer.from(buffer).toString('base64');

          // Get MIME type from response headers (fallback to 'image/jpeg')
          const mimeType = response.headers.get('content-type') || 'image/jpeg';

          // Add Base64 data URL to officerData
          profileImageBase64 = `data:${mimeType};base64,${base64Image}`;
          console.log('Successfully converted image to base64');
          console.log(profileImageBase64);
        }
      } catch (imageError) {
        console.error('Error converting image to Base64:', imageError);
        // Set base64Image to null if conversion fails
        profileImageBase64 = null;
      }
    } else {
      // No image URL provided
      profileImageBase64 = null;
    }

    const responseData = { profileImageBase64 };

    // Convert to JSON string
    const jsonString = JSON.stringify(responseData);

    // Get byte size
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

    console.log(`Response size: ${sizeInBytes} bytes`);

    res.json({ profileImageBase64 });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    console.error("Error executing query:", err);
    res.status(500).send("An error occurred while fetching data.");
  }
};


