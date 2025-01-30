const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthEP = require('../end-point/Auth-ep')

const router = express.Router();


router.get('/test', 
    AuthEP.test
);

router.post(
    "/login", 
    AuthEP.loginUser
);

router.post(
    "/change-passwords",
    authMiddleware,
    AuthEP.updatePassword
)

router.get(
    "/get-profile",
    authMiddleware,
    AuthEP.getProfile
)

module.exports = router;