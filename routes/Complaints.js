const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ComplaintEP = require('../end-point/Complaints-ep')

const router = express.Router();


router.get('/get-recived-complaints', 
    authMiddleware,
    ComplaintEP.getAllRecivedComplain
);

router.get('/get-recived-complaints-by-id/:id', 
    authMiddleware,
    ComplaintEP.getRecivedComplainById
);


module.exports = router;