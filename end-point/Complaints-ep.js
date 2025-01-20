const ComplaintValidate = require('../validations/Complaints-validation')
const ComplaintDAO = require('../dao/Complaints-dao')


exports.getAllRecivedComplain = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const result = await ComplaintDAO.getAllRecivedComplainDao()

    console.log("Successfully fetched recived complaind");
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching recived complaind:", error);
    return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}