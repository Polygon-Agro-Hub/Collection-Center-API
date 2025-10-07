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