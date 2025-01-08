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

    if(!targetId){
      return res.json({message:"Faild create target try again!", status:false})
    }

    for (let i = 0; i < target.TargetItems.length; i++) {
      console.log(i);
      await TargetDAO.createDailyTargetItemsDao(target.TargetItems[i], targetId);
    }

    console.log("Daily Target Created Successfully");
    res.json({message:"Daily Target Created Successfully!", status:true})
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