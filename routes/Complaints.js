const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ComplaintEP = require('../end-point/Complaints-ep')

const router = express.Router();


router.get('/get-recived-complaints', 
    authMiddleware,
    ComplaintEP.getAllRecivedComplain
);


module.exports = router;