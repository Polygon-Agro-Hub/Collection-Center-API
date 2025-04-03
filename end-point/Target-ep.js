const TargetDAO = require('../dao/Target-dao')
const TargetValidate = require('../validations/Target-validation')



exports.getAllCropCatogory = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const result = await TargetDAO.getAllCropNameDAO()

    console.log("Successfully fetched gatogory");
    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
}

exports.addDailyTarget = async (req, res) => {
  try {
    const target = req.body;
    const companyId = req.user.companyId;
    const userId = req.user.userId;

    const targetId = await TargetDAO.createDailyTargetDao(target, companyId, userId);
    if (!targetId) {
      return res.json({ message: "Faild create target try again!", status: false })
    }

    for (let i = 0; i < target.TargetItems.length; i++) {
      await TargetDAO.createDailyTargetItemsDao(target.TargetItems[i], targetId);
    }
    console.log("Daily Target Created Successfully");
    res.json({ message: "Daily Target Created Successfully!", status: true })
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


exports.getAllDailyTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { searchText, page, limit } = await TargetValidate.getAllDailyTargetSchema.validateAsync(req.query);
    const centerId = req.user.centerId
    console.log(centerId);

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5); // Get the current time in HH:MM format

    console.log("Current Date:", currentDate);  // Output: 2025-03-31
    console.log("Current Time:", currentTime);  // Output: 14:25

    const { resultTarget, total } = await TargetDAO.getAllDailyTargetDAO(centerId, page, limit, searchText, currentDate, currentTime);
    console.log('these are results', resultTarget);
    const combinedData = [];

    for (const target of resultTarget) {
      if (target.qtyA !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "A",
          status: parseFloat(target.complteQtyA) >= parseFloat(target.qtyA) ? 'Completed' : 'Pending',
          TargetQty: target.qtyA,
          CompleteQty: target.complteQtyA || "0.00",
        });
      }

      if (target.qtyB !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "B",
          status: parseFloat(target.complteQtyB) >= parseFloat(target.qtyB) ? 'Completed' : 'Pending',
          TargetQty: target.qtyB,
          CompleteQty: target.complteQtyB || "0.00",
        });
      }

      if (target.qtyC !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "C",
          status: parseFloat(target.complteQtyC) >= parseFloat(target.qtyC) ? 'Completed' : 'Pending',
          TargetQty: target.qtyC,
          CompleteQty: target.complteQtyC || "0.00",
        });
      }
    }


    console.log("Successfully transformed data");
    return res.status(200).json({
      items: combinedData,
      totalPages: total
    });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
};


exports.downloadDailyTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const { fromDate, toDate } = await TargetValidate.downloadDailyTargetSchema.validateAsync(req.query);
    const companyId = req.user.companyId

    const resultTarget = await TargetDAO.downloadAllDailyTargetDao(companyId, fromDate, toDate);
    // const resultComplete = await TargetDAO.downloadAllDailyTargetCompleteDAO(companyId, fromDate, toDate);
    const combinedData = [];

    for (const target of resultTarget) {
      if (target.qtyA !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "A",
          status: parseFloat(target.complteQtyA) >= parseFloat(target.qtyA) ? 'Completed' : 'Pending',
          TargetQty: target.qtyA,
          CompleteQty: target.complteQtyA || "0.00",
        });
      }

      if (target.qtyB !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "B",
          status: parseFloat(target.complteQtyB) >= parseFloat(target.qtyB) ? 'Completed' : 'Pending',
          TargetQty: target.qtyB,
          CompleteQty: target.complteQtyB || "0.00",
        });
      }

      if (target.qtyC !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "C",
          status: parseFloat(target.complteQtyC) >= parseFloat(target.qtyC) ? 'Completed' : 'Pending',
          TargetQty: target.qtyC,
          CompleteQty: target.complteQtyC || "0.00",
        });
      }
    }



    console.log("Successfully transformed data");
    return res.status(200).json({ message: 'Daily tartget find', status: true, data: combinedData });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
};

exports.getCenterDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  try {
    console.log(fullUrl);
    const companyId = req.user.companyId;
    console.log(companyId);
    const { province, district, searchText, page, limit } = req.query;

    const { totalItems, items } = await TargetDAO.getCenterDetailsDaoNew(
      companyId,
      province,
      district,
      searchText,
      parseInt(page),
      parseInt(limit)
    );

    console.log("Successfully retrieved company data");
    res.status(200).json({ items, totalItems });
  } catch (error) {
    console.error("Error retrieving center data:", error);
    return res.status(500).json({ error: "An error occurred while fetching the company data" });
  }
};

exports.getOfficerDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    // Validate query parameters      
    const validatedQuery = await TargetValidate.getOfficerDetailsSchema.validateAsync(req.query);
    const { centerId, page, limit, role, status, searchText } = validatedQuery;

    const { items, total } = await TargetDAO.getOfficerDetailsDAO(centerId, page, limit, role, status, searchText);
    console.log("Successfully fetched collection officers");

    return res.status(200).json({ items, total });
  } catch (error) {
    console.error("Error fetching collection officers:", error);

    if (error.isJoi && error.details) {
      return res.status(400).json({ error: error.details[0].message });
    }
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getCenterDashbord = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const { id } = req.params;
    const officerCount = await TargetDAO.getCenterNameAndOficerCountDao(id);
    const transCount = await TargetDAO.getTransactionCountDao(id);
    const transAmountCount = await TargetDAO.getTransactionAmountCountDao(id);
    const resentCollection = await TargetDAO.getReseantCollectionDao(id);
    const totExpences = await TargetDAO.getTotExpencesDao(id);
    const difExpences = await TargetDAO.differenceBetweenExpences(id);

    const limitedResentCollection = resentCollection.slice(0, 5);

    console.log(transCount);


    console.log("Successfully fetched gatogory");
    return res.status(200).json({ officerCount, transCount: transCount, transAmountCount, limitedResentCollection, totExpences, difExpences });
  } catch (error) {
    if (error.isJoi) {
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
}

exports.getAllPriceDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const companyId = req.user.companyId
    const { centerId, page, limit, grade, searchText } = await TargetValidate.getAllPriceDetailSchema.validateAsync(req.query);
    // const { items, total } = await PriceListDAO.getAllPriceListDao(centerId, page, limit, grade, searchText);

    const { items, total } = await TargetDAO.getAllPriceDetailsDao(companyId, centerId, page, limit, grade, searchText);

    console.log("Successfully retrieved price list");
    res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving price list:", error);
    return res.status(500).json({ error: "An error occurred while fetching the price list" });
  }
};

exports.getAssignCenterTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const { page, limit } = await TargetValidate.assignDailyTargetSchema.validateAsync(req.query);
    const centerId = req.user.centerId

    const { resultTarget, total } = await TargetDAO.getAssignCenterTargetDAO(centerId);
    console.log(resultTarget);

    console.log("Successfully transformed data");
    return res.status(200).json({ items: resultTarget, total: total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
};


exports.getTargetVerity = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const userId = req.user.userId;

    const resultCrop = await TargetDAO.getTargetVerityDao(id);
    const resultOfficer = await TargetDAO.getAssingTargetForOfficersDao(userId);

    if (resultCrop.length === 0) {
      return res.status(400).json({ error: "No data found" });
    }
    console.log("Successfully retrieved target crop verity");
    res.status(200).json({ crop: resultCrop, officer: resultOfficer });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.AssignOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const id = parseInt(req.body.id);
    const verityId = parseInt(req.body.varietyId);
    const targetData = req.body.OfficerData;
    console.log(req.body);



    for (let i = 0; i < targetData.length; i++) {
      if (targetData[i].targetA !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(id, verityId, targetData[i].id, 'A', targetData[i].targetA);
      }
      if (targetData[i].targetB !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(id, verityId, targetData[i].id, 'B', targetData[i].targetB);
      }
      if (targetData[i].targetC !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(id, verityId, targetData[i].id, 'C', targetData[i].targetC);
      }
    }

    const updateStatus = await TargetDAO.updateTargetAssignStatus(id, verityId)
    console.log(updateStatus);
    if (updateStatus.affectedRows === 0) {
      return res.json({ status: false, messsage: "Target Assigned Faild" });

    }

    console.log("Successfully retrieved target crop verity");
    res.status(200).json({ status: true, messsage: "Target Assigned Successfully" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.getTargetDetailsToPass = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {

    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const userId = req.user.userId;
    const resultTarget = await TargetDAO.getTargetDetailsToPassDao(id);
    const resultOfficer = await TargetDAO.getOfficersToPassTargetDao(userId);

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


exports.passTargetToOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const target = await TargetValidate.PassTargetValidationSchema.validateAsync(req.body);
    const targetResult = await TargetDAO.getTargetDetailsToPassDao(target.target);
    const passingOfficer = await TargetDAO.getPassingOfficerDao(targetResult, target.officerId);

    let resultUpdate
    let result

    const amount = targetResult.target - target.amount;

    if (passingOfficer.length === 0) {
      resultUpdate = await TargetDAO.updateTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        result = await TargetDAO.AssignOfficerTargetDao(targetResult.targetId, targetResult.cropId, target.officerId, targetResult.grade, parseFloat(target.amount));
      } else {
        return res.json({ status: false, message: "Target Passing Unsccessfull!" });
      }
    } else {
      resultUpdate = await TargetDAO.updateTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {


        const newAmount = parseFloat(passingOfficer[0].target) + target.amount;
        result = await TargetDAO.updateTargetDao(passingOfficer[0].id, newAmount);
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

exports.getOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {


    const userId = req.user.userId;
    const { status, search } = await TargetValidate.getOfficerTargetSchema.validateAsync(req.query);;

    const results = await TargetDAO.getOfficerTargetDao(userId, status, search);
    return res.status(200).json({ items: results });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.getSelectedOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {

    // const { officerId, status, search } = req.query

    const { officerId, status, search } = await TargetValidate.getSelectedOfficerTargetSchema.validateAsync(req.query);


    const results = await TargetDAO.getOfficerTargetDao(officerId, status, search);

    console.log("success fully fetched results");
    return res.status(200).json({ items: results });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};

exports.createCenter = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    console.log(req.user);

    // Ensure required data is provided
    if (!req.body.centerData) {
      return res.status(400).json({ error: "Center data is missing" });
    }

    const centerData = JSON.parse(req.body.centerData);
    const companyId = req.user.companyId;

    // Call the TargetDAO.createCenter function with the required parameters
    const result = await TargetDAO.createCenter(centerData, companyId);

    // Check if data was successfully inserted
    if (result) {
      console.log("Center created successfully");
      console.log(result);
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
      // Handle validation error
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error creating Center:", error);
    return res.status(500).json({
      error: "An error occurred while creating the Center",
    });
  }
};




exports.getExsistVerityTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    // /:
    // const { targetid, cropid } = await TargetValidate.getExsistVerityTargetSchema.validateAsync(req.params);
    const targetid = req.params.id
    const userId = req.user.userId;

    const resultCrop = await TargetDAO.getTargetVerityDao(targetid);
    const resultOfficer = await TargetDAO.getExsistVerityTargetDao(resultCrop.id, resultCrop.varietyId, userId);

    console.log("Successfully retrieved target crop verity");
    res.status(200).json({ crop: resultCrop, officer: resultOfficer });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};



exports.editAssignedOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const id = parseInt(req.body.id);
    const verityId = parseInt(req.body.varietyId);
    const targetData = req.body.OfficerData;
    console.log(req.body);

    for (let i = 0; i < targetData.length; i++) {
      const officerData = targetData[i];

      // Update existing targets if they changed
      if (officerData.targetAId !== null && officerData.targetA !== officerData.prevousTargetA) {
        console.log("hti01", officerData.targetAId, officerData.targetA, officerData);
        await TargetDAO.updateTargetDao(officerData.targetAId, officerData.targetA);
      }

      if (officerData.targetBId !== null && officerData.targetB !== officerData.prevousTargetB) {
        console.log("hti02", officerData.targetBId, officerData.targetB);
        await TargetDAO.updateTargetDao(officerData.targetBId, officerData.targetB);
      }

      if (officerData.targetCId !== null && officerData.targetC !== officerData.prevousTargetC) {
        console.log("hti03", officerData.targetCId, officerData.targetC);
        await TargetDAO.updateTargetDao(officerData.targetCId, officerData.targetC);
      }

      // Create new targets if they don't exist
      if (officerData.targetAId === null && officerData.targetA !== 0) {
        console.log("hti04", id, verityId, officerData.id, 'A', officerData.targetA);
        await TargetDAO.AssignOfficerTargetDao(id, verityId, officerData.id, 'A', officerData.targetA);
      }

      if (officerData.targetBId === null && officerData.targetB !== 0) {
        console.log("hti05", id, verityId, officerData.id, 'B', officerData.targetB);
        await TargetDAO.AssignOfficerTargetDao(id, verityId, officerData.id, 'B', officerData.targetB);
      }

      if (officerData.targetCId === null && officerData.targetC !== 0) {
        console.log("hti06", id, verityId, officerData.id, 'C', officerData.targetC);
        await TargetDAO.AssignOfficerTargetDao(id, verityId, officerData.id, 'C', officerData.targetC);
      }
    }

    console.log("Successfully updated officer targets");
    res.status(200).json({ status: true, message: "Target Assigned Successfully" });
  } catch (error) {
    console.error("Error updating officer targets:", error);

    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    return res.status(500).json({
      error: "An error occurred while updating officer targets",
      details: error.message
    });
  }
};

exports.getCenterTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);
  try {
    const { centerId, searchText, page, limit } = await TargetValidate.getCenterTargetSchema.validateAsync(req.query);

    const { resultTarget, total } = await TargetDAO.getCenterTargetDAO(centerId, page, limit, searchText);
    console.log(total);
    const combinedData = [];

    for (const target of resultTarget) {
      if (target.qtyA !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "A",
          status: parseFloat(target.complteQtyA) >= parseFloat(target.qtyA) ? 'Completed' : 'Pending',
          TargetQty: target.qtyA,
          CompleteQty: target.complteQtyA || "0.00",
        });
      }

      if (target.qtyB !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "B",
          status: parseFloat(target.complteQtyB) >= parseFloat(target.qtyB) ? 'Completed' : 'Pending',
          TargetQty: target.qtyB,
          CompleteQty: target.complteQtyB || "0.00",
        });
      }

      if (target.qtyC !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "C",
          status: parseFloat(target.complteQtyC) >= parseFloat(target.qtyC) ? 'Completed' : 'Pending',
          TargetQty: target.qtyC,
          CompleteQty: target.complteQtyC || "0.00",
        });
      }
    }


    console.log("Successfully transformed data");
    return res.status(200).json({
      items: combinedData,
      totalPages: total
    });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
};


// --------------- new part ------------------


exports.getCenterCenterCrops = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const companyId = req.user.companyId;
    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const { page, limit, searchText } = await TargetValidate.getCenterCropsSchema.validateAsync(req.query);

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, id);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const { items, total } = await TargetDAO.getCenterCenterCropsDao(companyCenterId, page, limit, searchText);
    console.log(items, total);

    return res.status(200).json({ items, total });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.addOrRemoveCenterCrops = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const companyId = req.user.companyId;

    // const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const validateData = await TargetValidate.addOrRemoveCenterCropSchema.validateAsync(req.body);
    console.log(validateData);

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, validateData.centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    let result;
    if (validateData.isAssign === 1) {
      result = await TargetDAO.addCenterCropsDao(companyCenterId, validateData.cropId);
      if (result.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to add crop" });
      }
    } else if (validateData.isAssign === 0) {
      result = await TargetDAO.removeCenterCropsDao(companyCenterId, validateData.cropId);
      if (result.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to remove crop" });
      }
    } else {
      return res.json({ status: false, message: "Invalid request" });
    }

    // const results = await TargetDAO.getCenterCenterCropsDao(companyId, id);
    return res.status(200).json({ status: true, message: "Successfully change crop" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.getSavedCenterCrops = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(fullUrl);

  try {
    const companyId = req.user.companyId;
    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    // const { page, limit, searchText } = await TargetValidate.getCenterCropsSchema.validateAsync(req.query);

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, id);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const result = await TargetDAO.getSavedCenterCropsDao(companyCenterId);
    // console.log(items, total);

    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};
