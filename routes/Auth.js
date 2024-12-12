const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthEP = require('../end-point/Auth-ep')

const router = express.Router();


router.get('/test', 
    AuthEP.test
);


module.exports = router;