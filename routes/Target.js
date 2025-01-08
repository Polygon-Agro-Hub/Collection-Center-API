const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const TargetEP = require('../end-point/Target-ep')

const router = express.Router();

router.get(
    '/get-crop-category',
    authMiddleware,
    TargetEP.getAllCropCatogory
)

router.post(
    "/create-daily-target",
    authMiddleware,
    TargetEP.addDailyTarget
)



module.exports = router;