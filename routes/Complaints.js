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

router.patch('/forword-to-complain/:id',
    authMiddleware,
    ComplaintEP.forwordComplaint
);


router.patch('/reply-complain',
    authMiddleware,
    ComplaintEP.replyComplain
);

router.get('/get-all-sent-complaint',
    authMiddleware,
    ComplaintEP.getAllSentComplaint
);

router.post('/add-complain',
    authMiddleware,
    ComplaintEP.addComplaint
);

router.get('/get-recived-cch-complaints', 
    authMiddleware,
    ComplaintEP.getAllRecivedCCHComplain
);

router.get('/get-all-sent-cch-complaint',
    authMiddleware,
    ComplaintEP.getAllSentCCHComplaint
)

module.exports = router;