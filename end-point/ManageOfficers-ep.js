const ManageOfficerValidate = require('../validations/ManageOfficer-validation')
const ManageOfficerDAO =  require('../dao/ManageOfficer-dao')

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
        return res.json({ result: {empId:"00001"}, status: true })
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