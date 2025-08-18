const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const DistributionEp = require('../end-point/Distribution-ep')
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get(
    "/get-all-distribution-centers",
    authMiddleware,
    DistributionEp.getDistributionCenterDetails
)

router.post(
    '/create-distribution-center',
    authMiddleware,
    upload.single("file"),
    DistributionEp.createDistributionCenter
)

router.get(
    "/get-all-center-officers-for-dch",
    authMiddleware,
    DistributionEp.getAllCenterOfficersForDCH
)

router.get(
    "/get-distribution-center-officers",
    authMiddleware,
    DistributionEp.getDistributionCenteOfficers
)


router.get(
    "/get-distribution-orders",
    authMiddleware,
    DistributionEp.getDistributionOrders
)

router.post(
    "/assign-orders-to-center-officers",
    authMiddleware,
    DistributionEp.assignOrdersToCenterOfficers
)

router.get(
    '/get-all-request',
    authMiddleware,
    DistributionEp.getAllRequestEp
)

router.post(
    '/approve-request',
    authMiddleware,
    DistributionEp.approveRequestEp
)

router.post(
    '/reject-request',
    authMiddleware,
    DistributionEp.rejectRequestEp
)

router.get('/get-all-assign-orders', 
    authMiddleware,
    DistributionEp.dcmGetAllAssignOrders
);
router.get('/get-todo-assign-orders', 
    authMiddleware,
    DistributionEp.dcmToDoAssignOrders
);

router.get('/get-completed-assign-orders', 
    authMiddleware,
    DistributionEp.dcmCompletedAssignOrders
);

router.get('/get-out-for-delivery-orders', 
    authMiddleware,
    DistributionEp.dcmOutForDeliveryOrders
);

router.post('/set-status-and-time', 
    authMiddleware,
    DistributionEp.dcmSetStatusAndTime
);

router.get('/get-officer-targets', 
    authMiddleware,
    DistributionEp.dcmGetOfficerTargets
);

router.get('/get-selected-officer-targets', 
    authMiddleware,
    DistributionEp.dcmGetSelectedOfficerTargets
);

router.get('/get-officers', 
    authMiddleware,
    DistributionEp.dcmGetOfficers
);

router.post('/pass-target', 
    authMiddleware,
    DistributionEp.dcmPassTarget
);

router.get('/get-all-products', 
    authMiddleware,
    DistributionEp.dcmGetAllProducts
);

router.get('/get-center-target', 
    authMiddleware,
    DistributionEp.dchGetCenterTarget
);

router.get('/get-center-target-out-for-delivery', 
    authMiddleware,
    DistributionEp.dchGetCenterTargetOutForDelivery
);

module.exports = router;