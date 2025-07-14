const DistributionDAO = require('../dao/Distribution-dao')
const DistributionValidate = require('../validations/Distribution-validation')
const XLSX = require('xlsx');

exports.getDistributionCenterDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
  
    try {
      const companyId = req.user.companyId;

      const { province, district, searchText, page, limit } = await DistributionValidate.getDistributionCenterSchema.validateAsync(req.query);
    //   const { province, district, searchText, page, limit } = req.query;

      console.log(companyId, province, district, searchText, page, limit)
  
      const { totalItems, items } = await DistributionDAO.getDistributionCenterDetailsDao(
        companyId,
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log(items);
  
      res.status(200).json({ items, totalItems });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the company data" });
    }
  };


  exports.createDistributionCenter = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
  
    try {
      if (!req.body.centerData) {
        return res.status(400).json({ error: "Center data is missing" });
      }
  
      const centerData = JSON.parse(req.body.centerData);
      const companyId = req.user.companyId;

      console.log('centerData', centerData)
  
      // Call the TargetDAO.createCenter function with the required parameters
      const result = await DistributionDAO.createDistributionCenter(centerData, companyId);
  
      // Check if data was successfully inserted
      if (result) {
        return res.status(201).json({
          message: "Center created successfully",
          status: true,
          data: result,
        });
      } else {
        return res.status(400).json({
          message: "Data insertion failed or no changes were made",
          status: false,
        });
      }
    } catch (error) {
      if (error.message.includes("Duplicate regCode")) {
        // Handle duplicate regCode error
        return res.status(409).json({ error: error.message });
      }
  
      if (error.isJoi) {
        return res.status(400).json({ error: error.details[0].message });
      }
  
      console.error("Error creating Center:", error);
      return res.status(500).json({
        error: "An error occurred while creating the Center",
      });
    }
  };
  