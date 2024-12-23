const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const PriceListEP = require('../end-point/PriceList-ep')

const router = express.Router();

router.get(
    '/view-all-price',
    authMiddleware,
    PriceListEP.getAllPrices
)

router.patch(
    '/update-price/:id',
    authMiddleware,
    PriceListEP.updatePrice
)


module.exports = router;