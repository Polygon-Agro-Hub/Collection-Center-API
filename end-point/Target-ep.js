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
    console.log(target.TargetItems.length, req.user);
    const companyId = req.user.companyId;
    const userId = req.user.userId;

    const targetId = await TargetDAO.createDailyTargetDao(target, companyId, userId);

    if (!targetId) {
      return res.json({ message: "Faild create target try again!", status: false })
    }

    for (let i = 0; i < target.TargetItems.length; i++) {
      console.log(i);
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
    const searchText = req.query.searchText
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    console.log(searchText, page, limit);

    const resultTarget = await TargetDAO.getAllDailyTargetDAO(searchText);
    const resultComplete = await TargetDAO.getAllDailyTargetCompleteDAO(searchText);

    const combinedData = [];

    for (const target of resultTarget) {
      const completeMatch = resultComplete.find(
        complete =>
          complete.cropNameEnglish === target.cropNameEnglish &&
          complete.varietyNameEnglish === target.varietyNameEnglish &&
          complete.grade === target.grade

      );

      
      if (target.varietyNameEnglish==='Kekulu') {
        console.log(completeMatch);
      }


      if (target.qtyA !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "A",
          status: parseFloat(completeMatch?.totA) >= parseFloat(target.qtyA) ? 'Completed' : 'Pending',
          TargetQty: target.qtyA,
          CompleteQty: completeMatch?.totA || "0.00",
        });
      }

      if (target.qtyB !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "B",
          status: parseFloat(completeMatch?.totB) >= parseFloat(target.qtyB) ? 'Completed' : 'Pending',
          TargetQty: target.qtyB,
          CompleteQty: completeMatch?.totB || "0.00",
        });
      }

      if (target.qtyC !== undefined) {
        combinedData.push({
          cropNameEnglish: target.cropNameEnglish,
          varietyNameEnglish: target.varietyNameEnglish,
          toDate: target.toDate,
          toTime: target.toTime,
          grade: "C",
          status: parseFloat(completeMatch?.totC) >= parseFloat(target.qtyC) ? 'Completed' : 'Pending',
          TargetQty: target.qtyC,
          CompleteQty: completeMatch?.totC || "0.00",
        });
      }
    }

    console.log("Successfully transformed data");
    return res.status(200).json(combinedData);
    // return res.status(200).json({resultTarget,resultComplete});

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    console.error("Error fetching crop names and verity:", error);
    return res.status(500).json({ error: "An error occurred while fetching crop names and verity" });
  }
};

