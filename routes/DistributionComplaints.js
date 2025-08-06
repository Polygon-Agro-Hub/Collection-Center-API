const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const DistributionComplaintsEp = require('../end-point/Distribution-Complaints-ep')

const router = express.Router();

router.get('/dcm-get-recived-complaints', 
    authMiddleware,
    DistributionComplaintsEp.dcmGetAllRecivedComplaints
);

router.get('/dcm-get-recived-complaints-by-id/:id', 
    authMiddleware,
    DistributionComplaintsEp.dcmGetRecivedComplainById
);

router.patch('/dcm-reply-complaint',
    authMiddleware,
    DistributionComplaintsEp.dcmReplyComplaint
);

router.patch('/dcm-forword-to-complaint/:id',
    authMiddleware,
    DistributionComplaintsEp.dcmforwordComplaint
);

router.post('/dcm-add-complain',
    authMiddleware,
    DistributionComplaintsEp.dcmAddComplaint
);

module.exports = router;