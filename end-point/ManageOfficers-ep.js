const ManageOfficerValidate = require('../validations/ManageOfficer-validation')
const ManageOfficerDAO = require('../dao/ManageOfficer-dao')
const bcrypt = require("bcryptjs");


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
    const officerData = req.body
    console.log(req.body);
    const centerId = req.user.centerId;
    const companyId = req.user.companyId;
    const managerID = req.user.userId;

    // const companyId = 1;
    // const centerId = 1;
    // const managerID = 11;


    const result = await ManageOfficerDAO.createCollectionOfficerPersonal(officerData, centerId, companyId, managerID);
    const cresteQR = await ManageOfficerDAO.CreateQRCodeForOfficerDao(result.insertId);
    console.log(cresteQR);


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
    console.log(validatedQuery);

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
    console.log(id, status);
    

    if (!id || !status) {
      return res.status(400).json({ message: 'ID and status are required.', status: false });
    }

    const officerData = await ManageOfficerDAO.getCollectionOfficerEmailDao(id);
    if (!officerData) {
      return res.status(404).json({ message: 'Collection officer not found.', status: false });
    }

    const { email, firstNameEnglish, empId, Existstatus } = officerData;
    console.log(`Email: ${email}, Name: ${firstNameEnglish}, Emp ID: ${empId}`,Existstatus);

    if(Existstatus === status){
      return res.json({ message: 'Status already updated.', status: false });
    }


    if (status === 'Approved') {
      const generatedPassword = Math.random().toString(36).slice(-8);
      console.log(generatedPassword);
      
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
    }else{
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
    const officerData = req.body
    console.log(officerData);

    const result = await ManageOfficerDAO.updateOfficerDetails(id, officerData);


    res.json({ message: 'Collection officer details updated successfully' });
  } catch (err) {
    console.error('Error updating collection officer details:', err);
    res.status(500).json({ error: 'Failed to update collection officer details' });
  }
};