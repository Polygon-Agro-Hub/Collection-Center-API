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

  exports.getAllCenterOfficersForDCH = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(`Request received at: ${fullUrl}`);
    
    try {
      // Validate query parameters      
      const validatedQuery = await DistributionValidate.getAllCenterOfficersSchema.validateAsync(req.query);
      const companyId = req.user.companyId;
  
      console.log('companyId', companyId)
      const { page, limit, centerId, status, role, searchText } = validatedQuery;
      console.log(page, limit, centerId, status, role, searchText)
      const { items, total } = await DistributionDAO.getAllOfficersForDCHDAO(companyId, centerId, page, limit, status, role, searchText);
      return res.status(200).json({ items, total });
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({ error: error.details[0].message });
      }
  
      console.error("Error fetching collection officers:", error);
      return res.status(500).json({ error: "An error occurred while fetching collection officers" });
    }
  };

  exports.getDistributionCenteOfficers = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl)
    try {
      
      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const result = await DistributionDAO.getDistributionCenterOfficerDao(managerId, companyId);
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

  exports.getDistributionOrders = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl)
    try {
      
      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
      const deliveryLocationDataObj = deliveryLocationData[0]
      console.log('result',deliveryLocationDataObj)

      const orders = await DistributionDAO.getDistributionOrders(deliveryLocationDataObj);
      console.log('orders',orders)
      return res.status(200).json(orders);
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({ error: error.details[0].message });
      }
  
      console.error("Error fetching collection officers:", error);
      return res.status(500).json({ error: "An error occurred while fetching collection officers" });
    }
  };
  