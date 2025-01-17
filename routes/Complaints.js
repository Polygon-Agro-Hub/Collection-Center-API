const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ComplaintEP = require('../end-point/Complaints-ep')

const router = express.Router();


// router.get('/test', 
//     AuthEP.test
// );


module.exports = router;