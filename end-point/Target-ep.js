const TargetDAO = require('../dao/Target-dao')
const TargetValidate = require('../validations/Target-validation')
const XLSX = require('xlsx');


exports.getAllCropCatogory = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const result = await TargetDAO.getAllCropNameDAO()

    return res.status(200).json(result);
  } catch (error) {
    if (error.isJoi) {

      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
}



exports.getAllDailyTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  try {
    const { searchText, page, limit } = await TargetValidate.getAllDailyTargetSchema.validateAsync(req.query);
    const centerId = req.user.centerId
    const companyId = req.user.companyId

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const { resultTarget, total } = await TargetDAO.getAllDailyTargetDAO(companyCenterId, searchText);
    res.status(200).json({
      items: resultTarget,
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

  try {
    const { fromDate, toDate } = await TargetValidate.downloadDailyTargetSchema.validateAsync(req.query);
    const centerId = req.user.centerId;
    const companyId = req.user.companyId;

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, centerId);

    if (companyCenterId === null) {
      return res.status(404).json({
        success: false,
        message: "No center found"
      });
    }

    const { resultTarget } = await TargetDAO.downloadAllDailyTargetDao(companyCenterId, fromDate, toDate);

    if (!resultTarget || resultTarget.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        message: "No targets found for the given criteria"
      });
    }

    return res.status(200).json({
      success: true,
      items: resultTarget
    });

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    console.error("Error fetching Target:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while fetching Target"
    });
  }
};

exports.getCenterDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  try {
    const companyId = req.user.companyId;
    const { province, district, searchText, page, limit } = req.query;

    const { totalItems, items } = await TargetDAO.getCenterDetailsDaoNew(
      companyId,
      province,
      district,
      searchText,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({ items, totalItems });
  } catch (error) {
    console.error("Error retrieving center data:", error);
    return res.status(500).json({ error: "An error occurred while fetching the company data" });
  }
};

exports.getOfficerDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  try {
    // Validate query parameters      
    const validatedQuery = await TargetValidate.getOfficerDetailsSchema.validateAsync(req.query);
    const { centerId, page, limit, role, status, searchText } = validatedQuery;

    const { items, total } = await TargetDAO.getOfficerDetailsDAO(centerId, page, limit, role, status, searchText);
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

  try {
    const { id } = req.params;
    const officerCount = await TargetDAO.getCenterNameAndOficerCountDao(id);
    const transCount = await TargetDAO.getTransactionCountDao(id);
    const transAmountCount = await TargetDAO.getTransactionAmountCountDao(id);
    const resentCollection = await TargetDAO.getReseantCollectionDao(id);
    const totExpences = await TargetDAO.getTotExpencesDao(id);
    const difExpences = await TargetDAO.differenceBetweenExpences(id);

    const limitedResentCollection = resentCollection.slice(0, 5);

    return res.status(200).json({ officerCount, transCount: transCount, transAmountCount, limitedResentCollection, totExpences, difExpences });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
}

exports.getAllPriceDetails = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const companyId = req.user.companyId
    const { centerId, page, limit, grade, searchText } = await TargetValidate.getAllPriceDetailSchema.validateAsync(req.query);
    const { items, total } = await TargetDAO.getAllPriceDetailsDao(companyId, centerId, page, limit, grade, searchText);

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
  try {
    const { searchText } = await TargetValidate.assignDailyTargetSchema.validateAsync(req.query);
    const centerId = req.user.centerId
    const companyId = req.user.companyId

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const resultTarget = await TargetDAO.getAssignCenterTargetDAO(companyCenterId, searchText);
    return res.status(200).json(resultTarget);
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

  try {
    const { varietyId, companyCenterId } = await TargetValidate.getTargetVeritySchema.validateAsync(req.params);
    const userId = req.user.userId;
    const resultCrop = await TargetDAO.getTargetVerityDao(companyCenterId, varietyId);
    const resultOfficer = await TargetDAO.getAssingTargetForOfficersDao(userId);

    if (resultCrop.length === 0) {
      return res.status(400).json({ error: "No data found" });
    }
    res.status(200).json({ crop: resultCrop[0], officer: resultOfficer });
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

  try {
    const id = parseInt(req.body.id);
    const verityId = parseInt(req.body.varietyId);
    const targetData = req.body.OfficerData;
    const { idA, idB, idC } = req.body.dailyTargetsIds

    for (let i = 0; i < targetData.length; i++) {
      if (targetData[i].targetA !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(idA, targetData[i].id, targetData[i].targetA);
      }
      if (targetData[i].targetB !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(idB, targetData[i].id, targetData[i].targetB);
      }
      if (targetData[i].targetC !== 0) {
        let result = await TargetDAO.AssignOfficerTargetDao(idC, targetData[i].id, targetData[i].targetC);
      }
    }

    const updateStatusA = await TargetDAO.updateTargetAssignStatus(idA)
    const updateStatusC = await TargetDAO.updateTargetAssignStatus(idB)
    const updateStatusB = await TargetDAO.updateTargetAssignStatus(idC)
    if (updateStatusA.affectedRows === 0 && updateStatusB.affectedRows === 0 && updateStatusC.affectedRows === 0) {
      return res.json({ status: true, messsage: "Target Assigned Faild" });

    }

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
  try {

    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const userId = req.user.userId;
    const resultTarget = await TargetDAO.getTargetDetailsToPassDao(id);
    const resultOfficer = await TargetDAO.getOfficersToPassTargetDao(userId);

    res.status(200).json({ resultTarget, resultOfficer });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};

//used to transfer CCM target
exports.passTargetToOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const target = await TargetValidate.PassTargetValidationSchema.validateAsync(req.body);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${yyyy}-${mm}-${dd}`;
    const targetResult = await TargetDAO.getTargetDetailsToPassDao(target.target);
    const passingOfficer = await TargetDAO.getPassingOfficerDao(targetResult, target.officerId, formattedDate);
    let resultUpdate
    let result

    const amount = targetResult.target - target.amount;

    if (passingOfficer.length === 0) {
      resultUpdate = await TargetDAO.updateOfficerTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        result = await TargetDAO.AssignOfficerTargetDao(targetResult.targetId, target.officerId, parseFloat(target.amount));
      } else {
        return res.json({ status: false, message: "Target Passing Unsccessfull!" });
      }
    } else {
      resultUpdate = await TargetDAO.updateOfficerTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        const newAmount = parseFloat(passingOfficer[0].target) + target.amount;
        result = await TargetDAO.updateOfficerTargetDao(passingOfficer[0].id, newAmount);
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

exports.getOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

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

  try {

    const { officerId, status, search } = await TargetValidate.getSelectedOfficerTargetSchema.validateAsync(req.query);


    const results = await TargetDAO.getOfficerTargetDao(officerId, status, search);

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

  try {
    if (!req.body.centerData) {
      return res.status(400).json({ error: "Center data is missing" });
    }

    const centerData = JSON.parse(req.body.centerData);
    const companyId = req.user.companyId;

    // Call the TargetDAO.createCenter function with the required parameters
    const result = await TargetDAO.createCenter(centerData, companyId);

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




exports.getExsistVerityTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const { varietyId, companyCenterId } = await TargetValidate.getTargetVeritySchema.validateAsync(req.params);

    const userId = req.user.userId;
    const resultCrop = await TargetDAO.getTargetVerityDao(companyCenterId, varietyId);
    const targetId = await TargetDAO.getAssignTargetIdsDao(companyCenterId, varietyId);
    const resultOfficer = await TargetDAO.getExsistVerityTargetDao(targetId[0], userId);

    res.status(200).json({ crop: resultCrop[0], officer: resultOfficer, targetId: targetId[0] });
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
  try {
    // const id = parseInt(req.body.id);
    const targetId = req.body.targetIds;
    const targetData = req.body.OfficerData;
    for (let i = 0; i < targetData.length; i++) {
      const officerData = targetData[i];

      // Update existing targets if they changed
      if (officerData.targetAId !== null && officerData.targetA !== officerData.prevousTargetA) {
        await TargetDAO.updateOfficerTargetDao(officerData.targetAId, officerData.targetA);
      }

      if (officerData.targetBId !== null && officerData.targetB !== officerData.prevousTargetB) {
        await TargetDAO.updateOfficerTargetDao(officerData.targetBId, officerData.targetB);
      }

      if (officerData.targetCId !== null && officerData.targetC !== officerData.prevousTargetC) {
        await TargetDAO.updateOfficerTargetDao(officerData.targetCId, officerData.targetC);
      }

      // Create new targets if they don't exist
      if (officerData.targetAId === null && officerData.targetA !== 0) {
        await TargetDAO.AssignOfficerTargetDao(targetId.idA, officerData.id, officerData.targetA);
      }

      if (officerData.targetBId === null && officerData.targetB !== 0) {
        await TargetDAO.AssignOfficerTargetDao(targetId.idB, officerData.id, officerData.targetB);
      }

      if (officerData.targetCId === null && officerData.targetC !== 0) {
        await TargetDAO.AssignOfficerTargetDao(targetId.idC, officerData.id, officerData.targetC);
      }
    }
    await TargetDAO.updateAssigStatusAsTrueDao(targetId.idA);
    await TargetDAO.updateAssigStatusAsTrueDao(targetId.idB);
    await TargetDAO.updateAssigStatusAsTrueDao(targetId.idC);

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
  try {
    const { centerId, page, limit, status, searchText } = await TargetValidate.getCenterTargetSchema.validateAsync(req.query);
    const companyId = req.user.companyId;

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const { resultTarget } = await TargetDAO.getCenterTargetDAO(companyCenterId, status, searchText);
    return res.status(200).json({
      items: resultTarget
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
  try {
    const companyId = req.user.companyId;
    const { id } = await TargetValidate.IdValidationSchema.validateAsync(req.params);
    const { page, limit, searchText } = await TargetValidate.getCenterCropsSchema.validateAsync(req.query);

    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, id);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const { items, total } = await TargetDAO.getCenterCenterCropsDao(companyCenterId, page, limit, searchText);
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
  try {
    const companyId = req.user.companyId;
    const validateData = await TargetValidate.addOrRemoveCenterCropSchema.validateAsync(req.body);
    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, validateData.centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    let result;
    let message;
    if (validateData.isAssign === 1) {
      result = await TargetDAO.addCenterCropsDao(companyCenterId, validateData.cropId);
      if (result.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to add crop" });
      }
      message = 'Crop Variety was successfully <b>Activated</b> on Centre Target'
    } else if (validateData.isAssign === 0) {
      result = await TargetDAO.removeCenterCropsDao(companyCenterId, validateData.cropId);
      if (result.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to remove crop" });
      }
      message = 'Crop Variety was successfully <b>Deactivated</b> on Centre Target'
    } else {
      return res.json({ status: false, message: "Invalid request" });
    }

    return res.status(200).json({ status: true, message: message });
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
  try {
    const companyId = req.user.companyId;
    const { id, date } = await TargetValidate.getSavedCenterCropsSchema.validateAsync(req.params);
    const { searchText } = await TargetValidate.getSavedCenterCropsQuaryParam.validateAsync(req.query);
    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, id);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const status = true;
    const result = await TargetDAO.getSavedCenterCropsDao(companyCenterId, date, status, searchText);
    return res.status(200).json({ result, companyCenterId });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error fetching collection officers:", error);


    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.updateTargetQty = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const { id, qty, date, companyCenterId, grade, varietyId } = await TargetValidate.updateTargetQtySchema.validateAsync(req.body);
    if (id !== null) {
      const resultUpdate = await TargetDAO.updateCenterTargeQtyDao(id, qty, date);
      if (resultUpdate.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to update target quantity" });
      }
    } else {
      const resultInsert = await TargetDAO.addNewCenterTargetDao(companyCenterId, varietyId, grade, qty, date)
      if (resultInsert.affectedRows === 0) {
        return res.json({ status: false, message: "Failed to update target quantity" });
      }
    }

    res.status(200).json({ status: true, message: "Successfully updated target quantity" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.addNewCenterTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const companyCenterId = req.body.companyCenterId
    const date = req.body.date
    const cropsData = req.body.crop

    let resultA
    let resultB
    let resultC
    for (let i = 0; i < cropsData.length; i++) {
      resultA = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'A', cropsData[i].targetA, date);
      resultB = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'B', cropsData[i].targetB, date);
      resultC = await TargetDAO.addNewCenterTargetDao(companyCenterId, cropsData[i].varietyId, 'C', cropsData[i].targetC, date);
    }

    res.status(200).json({ status: true, message: "Successfully Added New target quantity" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.officerTargetCheckAvailable = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const officer = req.body
    const user = req.user
    const { page, limit, status, validity, searchText } = req.query;
    const result = await TargetDAO.officerTargetCheckAvailableDao(officer);
    if (result === null) {
      return res.json({ message: "--No Data Available--", result: result, status: false });
    }

    const { items, total } = await TargetDAO.getAvailableOfficerDao(result.id, officer, page, limit, status, validity, searchText);

    if (result.companyId === user.companyId && result.centerId === user.centerId && (result.irmId === user.userId || result.id === user.userId)) {
      return res.json({ message: "--Officer Target Available--", result: items, status: true, total: total });
    }

    res.json({ status: false, message: "--You did't have permission to access this data--" });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error retrieving target crop verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching the target crop verity" });
  }
};


exports.transferOfficerTargetToOfficer = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const target = await TargetValidate.PassTargetValidationSchema.validateAsync(req.body);
    const targetResult = await TargetDAO.getTargetDetailsToPassDao(target.target);
    const passingOfficer = await TargetDAO.getPassingOfficerDao(targetResult, target.officerId, target.date);
    let resultUpdate
    let result

    const amount = targetResult.target - target.amount;

    if (passingOfficer.length === 0) {
      resultUpdate = await TargetDAO.updateOfficerTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        result = await TargetDAO.AssignOfficerTargetDao(targetResult.targetId, target.officerId, parseFloat(target.amount));
      } else {
        return res.json({ status: false, message: "Target Passing Unsccessfull!" });
      }
    } else {
      resultUpdate = await TargetDAO.updateOfficerTargetDao(targetResult.id, amount);
      if (resultUpdate.affectedRows > 0) {
        const newAmount = parseFloat(passingOfficer[0].target) + target.amount;
        result = await TargetDAO.updateOfficerTargetDao(passingOfficer[0].id, newAmount);
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

exports.downloadOfficerTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {
    const user = req.user
    const validatedQuery = await TargetValidate.downloadOfficerTargetSchema.validateAsync(req.query);

    const { fromDate, toDate, empId, status, validity, searchText } = validatedQuery;
    const result = await TargetDAO.officerTargetCheckAvailableForDownloadDao(empId);
    if (result === null) {
      return res.json({ message: "--No Data Available--", result: result, status: false });
    }

    const officerId = result.id

    const data = await TargetDAO.downloadOfficerTargetReportDao(
      officerId,
      fromDate,
      toDate,
      status,
      validity,
      searchText
    );

    const formattedData = data.items.flatMap(item => [
      {
        'Crop Name': item.cropNameEnglish,
        'Variety Name': item.varietyNameEnglish,
        'Grade': item.grade,
        'Target (kg)': item.target,
        'To Do (kg)': item.toDo,
        'Completed (kg)': item.complete,
        'Date': item.date,
        'Status': item.status,
        'Validity': item.validity,

      },

    ]);


    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    worksheet['!cols'] = [
      { wch: 25 }, // GRN
      { wch: 15 }, // Amount
      { wch: 20 }, // Center Reg Code
      { wch: 25 }, // Center Name
      { wch: 18 }, // Farmer NIC
      { wch: 25 }, // Farmer Name
      { wch: 15 }, // Farmer Contact
      { wch: 25 }, // Account Holder Name
      { wch: 20 }, // Account Number

    ];


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Officer Target Template');

    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="Officer Target Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the file to the client
    res.send(excelBuffer);

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching collection officers:", error);
    return res.status(500).json({ error: "An error occurred while fetching collection officers" });
  }
};


exports.downloadCurrentTarget = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  try {

    const companyId = req.user.companyId;

    const { centerId, status, searchText } = await TargetValidate.downloadCurrentTargetSchema.validateAsync(req.query);
    const companyCenterId = await TargetDAO.getCompanyCenterIDDao(companyId, centerId);
    if (companyCenterId === null) {
      res.json({ items: [], message: "No center found" })
    }

    const { resultTarget } = await TargetDAO.downloadCurrentTargetDAO(companyCenterId, status, searchText);
    const formattedData = resultTarget.flatMap(item => [
      {
        'Crop Name': item.cropNameEnglish,
        'Variety Name': item.varietyNameEnglish,
        'Grade': item.grade,
        'Target (kg)': item.target,
        'Complete (kg)': item.complete,
        'Status': item.status,
        'End Date': item.date,

      },

    ]);


    // Create a worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    worksheet['!cols'] = [
      { wch: 25 }, // GRN
      { wch: 15 }, // Amount
      { wch: 20 }, // Center Reg Code
      { wch: 25 }, // Center Name
      { wch: 18 }, // Farmer NIC
      { wch: 25 }, // Farmer Name
      { wch: 15 }, // Farmer Contact

    ];


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Center Target Template');

    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="Current Center Target Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the file to the client
    res.send(excelBuffer);

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching Current Center Target:", error);
    return res.status(500).json({ error: "An error occurred while fetching Current Center Target" });
  }
};
