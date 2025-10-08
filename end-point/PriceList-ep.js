const PriceListDAO = require('../dao/PriceList-dao')
const PriceListValidate = require('../validations/PriceList-validation')

exports.getAllPrices = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const centerId = req.user.centerId
        const companyId = req.user.companyId
        console.log('centerId', centerId, 'companyId', companyId)
        const { page, limit, grade, searchText } = await PriceListValidate.getAllPriceListSchema.validateAsync(req.query);
        const { items, total } = await PriceListDAO.getAllPriceListDao(companyId, centerId, page, limit, grade, searchText);

        res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};


exports.updatePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;

        const result = await PriceListDAO.updatePriceDao(id, value);

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to update price" })

        }
        res.json({ status: true, message: 'Collection officer details updated successfully' });

    } catch (err) {
        console.error('Error updating collection officer details:', err);
        res.status(500).json({ error: 'Failed to update collection officer details' });
    }
};


exports.getAllRequest = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl)
    try {
        const centerId = req.user.centerId
        console.log(centerId);
        const { page, limit, grade, status, searchText } = await PriceListValidate.getRequestPriceSchema.validateAsync(req.query);
        console.log(page, limit)
        const { items, total } = await PriceListDAO.getAllPriceRequestDao(centerId, page, limit, grade, status, searchText);
        console.log(total)

        res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }
        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};


exports.changeRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await PriceListDAO.ChangeRequestStatusDao(id, status);

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to update request status" })

        }

        res.json({ status: true, message: 'request status updated successfully' });
    } catch (err) {
        console.error('Error updating request status details:', err);
        res.status(500).json({ error: 'Failed to update request status details' });
    }
};


exports.forwardRequestEp = async (req, res) => {
    try {
        // const { id } = await PriceListValidate.forwardRequestSchema.validateAsync(req.params);

        const id = req.params.id

        const result = await PriceListDAO.forwrdRequestDao(id);

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to forward request" })

        }
        res.json({ status: true, message: 'request forward successfully' });
    } catch (err) {
        console.error('Error forwarding request:', err);
        res.status(500).json({ error: 'Failed to forward request' });
    }
};

exports.getAllCropGroupEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const centerId = req.user.centerId
        const companyId = req.user.companyId
        console.log('centerId', centerId, 'companyId', companyId)
        const { items } = await PriceListDAO.getAllCropGroupDao(companyId, centerId);

        res.status(200).json({ items });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};

exports.getAllCropVarietyEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { cropGroupId } = await PriceListValidate.getCropVarietySchema.validateAsync(req.params);

        // const {cropGroupId} = req.params;

        const { items } = await PriceListDAO.getSelectedCropVarietyDao(cropGroupId);

        res.status(200).json({ items });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};


exports.getCurrentPriceEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { cropGroupId, cropVarietyId, grade } = await PriceListValidate.getCurrentPriceSchema.validateAsync(req.params);

        // const {cropGroupId} = req.params;

        const { items } = await PriceListDAO.getCurrentPriceDao(cropGroupId, cropVarietyId, grade);
        console.log('iemts', items)

        res.status(200).json({ items });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};

exports.addRequestEp = async (req, res) => {
    try {
        const { id, cropGroupId, cropVarietyId, grade, currentPrice, requstPrice } = await PriceListValidate.addRequestSchema.validateAsync(req.body);

        const centerId = req.user.centerId;
        console.log('user', req.user)

        const result = await PriceListDAO.addRequestDao(id, centerId, req.user.userId, requstPrice);

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to add request" })

        }
        res.json({ status: true, message: 'request added successfully' });
    } catch (err) {
        console.error('Error adding request:', err);
        res.status(500).json({ error: 'Failed to add request' });
    }
};

exports.getAllRequestCCHEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl)
    try {
        const { page, limit, grade, status, searchText } = await PriceListValidate.getRequestPriceSchema.validateAsync(req.query);
        console.log(page, limit)
        const { items, total } = await PriceListDAO.getAllPriceRequestCCHDao(page, limit, grade, status, searchText);
        console.log(total)

        res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }
        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};


exports.getSelectedRequestCCHEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl)
    try {

        const { requestId } = await PriceListValidate.selectedRequestSchema.validateAsync(req.params);

        const { items } = await PriceListDAO.getSelectedPriceRequestCCHDao(requestId);

        res.status(200).json({ items });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }
        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};

exports.getAllPricesCCHEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {

        const { userId, page, limit, grade, searchText } = await PriceListValidate.getPriceListCCHSchema.validateAsync(req.query);

        const companyCenterId = await PriceListDAO.getCompanyCenterId(userId);
        console.log('companyCenterId', companyCenterId)

        const { items, total } = await PriceListDAO.getAllPriceListCCHDao(companyCenterId, page, limit, grade, searchText);

        res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error retrieving price list:", error);
        return res.status(500).json({ error: "An error occurred while fetching the price list" });
    }
};



exports.changeStatusEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { requestId, requestPrice, centerId } = await PriceListValidate.changeStatusSchema.validateAsync(req.params);

        const companyId = req.user.companyId

        console.log('companyId', companyId)

        const companyCenterId = await PriceListDAO.getCompanyCenterDao(centerId, companyId);

        console.log('companyCenterId', companyCenterId)

        const marketPriceId = await PriceListDAO.changeStatusDao(requestId);

        console.log('marketPriceId', marketPriceId)

        const result = await PriceListDAO.updateMarketPriceCCHDao(marketPriceId, companyCenterId, requestPrice)
        console.log('marketPriceId', marketPriceId, 'companyCenterId', companyCenterId)

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to update request" })

        }
        res.json({ status: true, message: 'request updateed successfully' });
    } catch (err) {
        console.error('Error adding request:', err);
        res.status(500).json({ error: 'Failed to update request' });
    }
};

exports.rejectStatusEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { requestId } = await PriceListValidate.changeStatusSchema.validateAsync(req.params);

        const result = await PriceListDAO.rejectStatusDao(requestId);

        if (result.affectedRows === 0) {
            return res.json({ status: false, message: "Faild to reject the request" })

        }
        res.json({ status: true, message: 'request rejected successfully' });
    } catch (err) {
        console.error('Error adding request:', err);
        res.status(500).json({ error: 'Failed to reject request' });
    }
};