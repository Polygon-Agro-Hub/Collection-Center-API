const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const DashboardEP = require('../end-point/Dashboard-ep')

const router = express.Router();

router.get('/get-officer-counts', 
    authMiddleware,
    DashboardEP.getOfficerCount
);

router.get('/get-activity', 
    authMiddleware,
    DashboardEP.getActivity
);

module.exports = router;
