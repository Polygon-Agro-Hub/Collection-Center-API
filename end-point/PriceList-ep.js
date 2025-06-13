const PriceListDAO = require('../dao/PriceList-dao')
const PriceListValidate = require('../validations/PriceList-validation')

exports.getAllPrices = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const centerId = req.user.centerId
        const companyId = req.user.companyId
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

