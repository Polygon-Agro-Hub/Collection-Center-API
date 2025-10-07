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

router.get(
    '/get-all-price-request',
    authMiddleware,
    PriceListEP.getAllRequest
)


router.patch(
    '/change-request-status/:id',
    authMiddleware,
    PriceListEP.changeRequestStatus
)

router.patch(
    '/forward-request/:id',
    authMiddleware,
    PriceListEP.forwardRequestEp
)

router.get(
    '/get-all-crop-group',
    authMiddleware,
    PriceListEP.getAllCropGroupEp
)
router.get(
    '/get-all-crop-variety/:cropGroupId',
    authMiddleware,
    PriceListEP.getAllCropVarietyEp
)

router.get(
    '/get-current-price/:cropGroupId/:cropVarietyId/:grade',
    authMiddleware,
    PriceListEP.getCurrentPriceEp
)



module.exports = router;

