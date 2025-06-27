const ComplaintValidate = require('../validations/Complaints-validation')
const ComplaintDAO = require('../dao/Complaints-dao')


exports.getAllRecivedComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        console.log(userId);
        const { page, limit, searchText, status } = await ComplaintValidate.getAllDailyTargetSchema.validateAsync(req.query);

        const { items, total } = await ComplaintDAO.getAllRecivedComplainDao(userId, page, limit, status, searchText)
        return res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}


exports.getRecivedComplainById = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const { id } = await ComplaintValidate.getparmasIdSchema.validateAsync(req.params);
        const result = await ComplaintDAO.GetReciveReplyByIdDao(id)
        const templateData = await ComplaintDAO.GetComplainTemplateDataDao(userId)


        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false, data: result[0], template: templateData });
        }

        res.status(200).json({ message: "Data found!", status: true, data: result[0], template: templateData });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.forwordComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { id } = await ComplaintValidate.getparmasIdSchema.validateAsync(req.params);

        const result = await ComplaintDAO.forwordComplaintDao(id)
        if (result.affectedRows === 0) {
            return res.json({ message: "Forword faild try again!", status: false })
        }

        res.status(200).json({ message: "Complaint was forward to Center Head!", status: true });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error forword complaint:", error);
        return res.status(500).json({ error: "An error occurred while forword complaint" });
    }
}


exports.replyComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const complain = await ComplaintValidate.replyComplainSchema.validateAsync(req.body)

        const result = await ComplaintDAO.replyComplainDao(complain)

        if (result.affectedRows === 0) {
            return res.json({ message: "Reply Does not send!", status: false })
        }

        res.status(200).json({ message: "Complaint Replied!", status: true });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error forword complaint:", error);
        return res.status(500).json({ error: "An error occurred while forword complaint" });
    }
}


exports.getAllSentComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const companyId = req.user.companyId

        const { page, limit, searchText, status, emptype } = await ComplaintValidate.getAllDailyTargetSchema.validateAsync(req.query);

        const { items, total } = await ComplaintDAO.getAllSendComplainDao(userId, companyId, page, limit, status, emptype, searchText)

        return res.status(200).json({ items, total, userId });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.addComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { category, complaint } = await ComplaintValidate.addComplaintSchema.validateAsync(req.body);
        const officerId = req.user.userId

        const result = await ComplaintDAO.addComplaintDao(officerId, category, complaint);
        if (result.affectedRows === 0) {
            return res.json({ message: "Complaint could not be added. Please try again!", status: false });
        }

        res.status(201).json({ message: "Complaint added successfully!", status: true });

    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error adding complaint:", error);
        return res.status(500).json({ error: "An error occurred while adding the complaint" });
    }
};


exports.getAllRecivedCCHComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const companyId = req.user.companyId
        const { page, limit, searchText, status } = await ComplaintValidate.getAllDailyTargetSchema.validateAsync(req.query);
        const { items, total } = await ComplaintDAO.getAllRecivedCCHComplainDao(companyId, page, limit, status, searchText)
        return res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}


exports.getAllSentCCHComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const companyId = req.user.companyId

        const { page, limit, searchText, status, emptype } = await ComplaintValidate.getAllDailyTargetSchema.validateAsync(req.query);

        const { items, total } = await ComplaintDAO.getAllSendCCHComplainDao(userId, companyId, page, limit, status, emptype, searchText)
        return res.status(200).json({ items, total, userId });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}


exports.forwordComplaintToAdmin = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { id } = await ComplaintValidate.getparmasIdSchema.validateAsync(req.params);

        const result = await ComplaintDAO.forwordComplaintToAdminDao(id)
        if (result.affectedRows === 0) {
            return res.json({ message: "Forword faild try again!", status: false })
        }
        res.status(200).json({ message: "Complaint was forward to Agro World Admin!", status: true });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error forword complaint:", error);
        return res.status(500).json({ error: "An error occurred while forword complaint" });
    }
}


exports.addComplaintCCH = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { category, complaint } = await ComplaintValidate.addComplaintSchema.validateAsync(req.body);
        const officerId = req.user.userId

        const result = await ComplaintDAO.addComplaintCCHDao(officerId, category, complaint);

        if (result.affectedRows === 0) {
            return res.json({ message: "Complaint could not be added. Please try again!", status: false });
        }
        res.status(201).json({ message: "Complaint added successfully!", status: true });

    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error adding complaint:", error);
        return res.status(500).json({ error: "An error occurred while adding the complaint" });
    }
};


exports.getAllCollectiOfficerCategory = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const result = await ComplaintDAO.getAllCollectiOfficerCategoryDao();

        return res.status(200).json(result);
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }
        console.error("Error fetching collection officers:", error);
        return res.status(500).json({ error: "An error occurred while fetching collection officers" });
    }
};


exports.CCHReplyComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const complain = await ComplaintValidate.replyComplainSchema.validateAsync(req.body)
        const result = await ComplaintDAO.CCHReplyComplainDao(complain)
        if (result.affectedRows === 0) {
            return res.json({ message: "Reply Does not send!", status: false })
        }
        res.status(200).json({ message: "Complaint Replyed!", status: true });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error forword complaint:", error);
        return res.status(500).json({ error: "An error occurred while forword complaint" });
    }
}