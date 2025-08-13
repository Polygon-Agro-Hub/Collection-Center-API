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
  
  exports.assignOrdersToCenterOfficers = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);
  
    try {
      const data = req.body;
      console.log('data', data);
      const managerId = req.user.userId;
  
      const companyCenterId = await DistributionDAO.getCompanyCenterId(managerId);
  
      const { assignments, processOrderIds } = data;
  
      if (!assignments || !processOrderIds) {
        return res.status(400).json({ error: 'Missing assignments or processOrderIds in request body' });
      }
  
      // Format assigned orders
      const formattedAssignments = [];
      let currentIndex = 0;
  
      for (const officer of assignments) {
        const { officerId, count } = officer;
      
        if (count === 0) continue; // Skip if no orders assigned
      
        const assignedOrderIds = processOrderIds.slice(currentIndex, currentIndex + count);
      
        formattedAssignments.push({
          officerId,
          count,
          assignedOrderIds
        });
      
        currentIndex += count;
      }
  
      console.log('formattedAssignments', formattedAssignments);
      console.log('processOrderIds', processOrderIds);
  
      // STEP 1: Insert distribution targets
      const result = await DistributionDAO.assignDistributionTargetsDAO(companyCenterId, formattedAssignments);
  
      // result.insertId gives the first inserted ID in multi-row INSERT
      if (result && result.insertId) {
        const firstInsertId = result.insertId;
  
        // STEP 2: Create data for distributedtargetitems table
        const itemsToInsert = [];
  
        for (let i = 0; i < formattedAssignments.length; i++) {
          const assignment = formattedAssignments[i];
          const targetId = firstInsertId + i; // Auto-increment continues from insertId
          for (const orderId of assignment.assignedOrderIds) {
            itemsToInsert.push([targetId, orderId]);
          }
        }
  
        // STEP 3: Insert distributedtargetitems in bulk
        await DistributionDAO.insertDistributedTargetItems(itemsToInsert);

        await DistributionDAO.markProcessOrdersAsAssigned(processOrderIds);
  
        return res.status(200).json({
          status: true,
          message: 'Orders assigned successfully',
          assignedOrders: formattedAssignments
        });
      } else {
        return res.status(500).json({ error: 'Failed to insert distribution targets' });
      }
  
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({ error: error.details[0].message });
      }
  
      console.error("Error assigning orders:", error);
      return res.status(500).json({ error: "An error occurred while assigning orders" });
    }
  };

  exports.getAllRequestEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
    try {
        const userId = req.user.userId;
        const companyId = req.user.companyId;
        const { page, limit, date, status, searchText } = await DistributionValidate.getRequestSchema.validateAsync(req.query);
        
        // Get the items and total count
        const { items, total } = await DistributionDAO.getAllReplaceProductsDao(
            userId, companyId, page, limit, date, status, searchText
        );

        // Enrich each item with additional data (direct field merge)
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
                const { rrId, ...additionalData } = await DistributionDAO.getReplaceRequestDetails(item.rrId);
                return {
                    ...item,
                    ...additionalData  // Spread the additional fields directly
                };
            })
        );

        console.log('enrichedItems', enrichedItems)
;
        res.status(200).json({ 
            items: enrichedItems, 
            total 
        });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }
        console.error("Error retrieving requests:", error);
        return res.status(500).json({ error: "An error occurred while fetching requests" });
    }
};

exports.approveRequestEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('Endpoint:', fullUrl);

  try {
    const request = req.body;
    console.log('Full Request:', request);

    // Filter necessary fields
    const approvedRequest = {
      rrId: request.rrId,
      replceId: request.replceId,
      status: request.status,
      orderPackageId: request.orderPackageId,
      isLock: request.isLock,
      replaceProductId: request.replaceProductId,
      replaceQty: parseFloat(request.replaceQty),
      replacePrice: parseFloat(request.replacePrice),
      replaceProductType: request.replaceProductType
    };

    console.log('Filtered Request:', approvedRequest);

    // Call the DB query function to update the row
    const result = await DistributionDAO.replaceProduct(approvedRequest);

    res.status(200).json({
      message: "Request approved and product replaced successfully",
      data: result
    });

  } catch (error) {
    console.error("Error approving request:", error);
    return res.status(500).json({ error: "An error occurred while approving the request" });
  }
};

exports.rejectRequestEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('Endpoint:', fullUrl);

  try {
    const request = req.body;
    console.log('Full Request:', request);

    // Filter necessary fields
    const approvedRequest = {
      rrId: request.rrId,
      status: request.status
    };

    console.log('Filtered Request:', approvedRequest);

    // Call the DB query function to update the row
    const result = await DistributionDAO.rejectRequestDao(approvedRequest);

    res.status(200).json({
      message: "Request Rejected successfully",
      data: result
    });

    console.log('result', result)

  } catch (error) {
    console.error("Error Rejecting request:", error);
    return res.status(500).json({ error: "An error occurred while rejecting the request" });
  }
};

exports.dcmGetAllAssignOrders = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {

      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
      const deliveryLocationDataObj = deliveryLocationData[0]
      console.log('result',deliveryLocationDataObj)

      // const orders = await DistributionDAO.getDistributionOrders(deliveryLocationDataObj);

      const userId = req.user.userId
      console.log(userId);
      const { page, limit, searchText, status, date } = await DistributionValidate.dcmGetAllAssignOrdersSchema.validateAsync(req.query);

      const { items, total } = await DistributionDAO.dcmGetAllAssignOrdersDao(managerId, page, limit, status, searchText, deliveryLocationDataObj, date)
      console.log('items', items)
      return res.status(200).json({ items, total });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}


exports.dcmToDoAssignOrders = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {

      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
      const deliveryLocationDataObj = deliveryLocationData[0]
      console.log('result',deliveryLocationDataObj)

      // const orders = await DistributionDAO.getDistributionOrders(deliveryLocationDataObj);

      const userId = req.user.userId
      console.log(userId);
      const { page, limit, searchText, status, date } = await DistributionValidate.dcmGetAllAssignOrdersSchema.validateAsync(req.query);

      const { items, total } = await DistributionDAO.dcmGetToDoAssignOrdersDao(managerId, page, limit, status, searchText, deliveryLocationDataObj, date)
      console.log('items', items)
      return res.status(200).json({ items, total });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.dcmCompletedAssignOrders = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {

      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
      const deliveryLocationDataObj = deliveryLocationData[0]
      console.log('result',deliveryLocationDataObj)

      // const orders = await DistributionDAO.getDistributionOrders(deliveryLocationDataObj);

      const userId = req.user.userId
      console.log(userId);
      const { page, limit, searchText, date } = await DistributionValidate.dcmGetCompletedAssignOrdersSchema.validateAsync(req.query);

      const { items, total } = await DistributionDAO.dcmGetCompletedAssignOrdersDao(managerId, page, limit, searchText, deliveryLocationDataObj, date)
      console.log('items', items)
      return res.status(200).json({ items, total });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.dcmOutForDeliveryOrders = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {

      const managerId = req.user.userId
      const companyId = req.user.companyId
      console.log('managerId', managerId)
      const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
      const deliveryLocationDataObj = deliveryLocationData[0]
      console.log('result',deliveryLocationDataObj)

      // const orders = await DistributionDAO.getDistributionOrders(deliveryLocationDataObj);

      const userId = req.user.userId
      console.log(userId);
      const { page, limit, searchText, status } = await DistributionValidate.dcmGetOutForDeliveryOrdersSchema.validateAsync(req.query);

      const { items, total } = await DistributionDAO.dcmGetOutForDeliveryOrdersDao(managerId, page, limit, status, searchText, deliveryLocationDataObj)
      console.log('items', items)
      return res.status(200).json({ items, total });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.dcmSetStatusAndTime = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {

      // const data = await DistributionValidate.dcmSetTimeAndStatusSchema.validateAsync(req.body);
      const data = req.body.data
      console.log('data', data);

      const result = await DistributionDAO.dcmSetStatusAndTimeDao(data)

      return res.status(200).json({ 
        success: true,
        message: 'Update successful',
        result
      });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.dcmGetOfficerTargets = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const managerId = req.user.userId;
    const companyId = req.user.companyId;
    console.log('managerId', managerId);

    const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
    const deliveryLocationDataObj = deliveryLocationData[0];
    console.log('result', deliveryLocationDataObj);

    const { items, total } = await DistributionDAO.dcmGetOfficerTargetsDao(managerId, deliveryLocationDataObj);
    console.log('items', items);

    // Group by officerId (userId) and count orders
    const groupedData = items.reduce((acc, item) => {
      const officerId = item.userId;
      if (!acc[officerId]) {
        acc[officerId] = {
          officerId,
          empId: item.empId,
          firstNameEnglish: item.firstNameEnglish,
          lastNameEnglish: item.lastNameEnglish,
          allOrders: 0,
          pending: 0,
          completed: 0,
          opened: 0
        };
      }

      acc[officerId].allOrders++;

      if (item.packagePackStatus === "Pending") acc[officerId].pending++;
      if (item.packagePackStatus === "Completed") acc[officerId].completed++;
      if (item.packagePackStatus === "Opened") acc[officerId].opened++;

      return acc;
    }, {});

    // Convert to sorted array by officerId
    const sortedResult = Object.values(groupedData).sort((a, b) => a.officerId - b.officerId);

    console.log('sortedResult', sortedResult);

    return res.status(200).json({ officers: sortedResult, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer targets:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer targets" });
  }
};

exports.dcmGetSelectedOfficerTargets = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {

    const { officerId, searchText, status } = await DistributionValidate.dcmGetparmasIdSchema.validateAsync(req.query);
    const managerId = req.user.userId;
    const companyId = req.user.companyId;
    console.log('managerId', managerId);

    const deliveryLocationData = await DistributionDAO.getCenterName(managerId, companyId);
    const deliveryLocationDataObj = deliveryLocationData[0];
    console.log('result', deliveryLocationDataObj);

    const { items, total } = await DistributionDAO.dcmGetSelectedOfficerTargetsDao(officerId, searchText, status, deliveryLocationDataObj);
    console.log('items', items);

    // // Group by officerId (userId) and count orders
    // const groupedData = items.reduce((acc, item) => {
    //   const officerId = item.userId;
    //   if (!acc[officerId]) {
    //     acc[officerId] = {
    //       officerId,
    //       empId: item.empId,
    //       firstNameEnglish: item.firstNameEnglish,
    //       lastNameEnglish: item.lastNameEnglish,
    //       allOrders: 0,
    //       pending: 0,
    //       completed: 0,
    //       opened: 0
    //     };
    //   }

    //   acc[officerId].allOrders++;

    //   if (item.packagePackStatus === "Pending") acc[officerId].pending++;
    //   if (item.packagePackStatus === "Completed") acc[officerId].completed++;
    //   if (item.packagePackStatus === "Opened") acc[officerId].opened++;

    //   return acc;
    // }, {});

    // Convert to sorted array by officerId
    // const sortedResult = Object.values(groupedData).sort((a, b) => a.officerId - b.officerId);

    // console.log('sortedResult', sortedResult);

    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching officer targets:", error);
    return res.status(500).json({ error: "An error occurred while fetching officer targets" });
  }
};


  
  

  // let resultA
      // let resultB
      // let resultC
      // for (let i = 0; i < cropsData.length; i++) {
      //   resultA = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'A', cropsData[i].targetA, date);
      //   resultB = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'B', cropsData[i].targetB, date);
      //   resultC = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'C', cropsData[i].targetC, date);
      // }

    // res.status(200).json({ status: true, message: "Successfully Added New target quantity" });