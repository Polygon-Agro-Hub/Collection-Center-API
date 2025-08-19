const DistributionComplaintsValidate = require('../validations/Distribution-Complaints-validation')
const DistributionComplaintsDAO = require('../dao/Distribution-Complaints-dao')

exports.dcmGetAllRecivedComplaints = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const userId = req.user.userId
        console.log(userId);
        const { page, limit, searchText, status } = await DistributionComplaintsValidate.dcmGetAllDailyTargetSchema.validateAsync(req.query);

        const { items, total } = await DistributionComplaintsDAO.dcmGetAllRecivedComplainDao(userId, page, limit, status, searchText)
        console.log('items', items)
        return res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.dcmGetRecivedComplainById = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const { id } = await DistributionComplaintsValidate.dcmGetparmasIdSchema.validateAsync(req.params);
        const result = await DistributionComplaintsDAO.dcmGetReciveReplyByIdDao(id)
        const templateData = await DistributionComplaintsDAO.dcmGetComplainTemplateDataDao(userId)


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

exports.dcmReplyComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        console.log('body', req.body)
        const userId = req.user.userId
        const complain = await DistributionComplaintsValidate.dcmReplyComplainSchema.validateAsync(req.body)

        console.log('complain', complain)

        const result = await DistributionComplaintsDAO.dcmReplyComplainDao(complain, userId)

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

exports.dcmforwordComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('full ue', fullUrl)
    try {
        const { id } = await DistributionComplaintsValidate.dcmGetparmasIdSchema.validateAsync(req.params);
        console.log('id', id);
        const result = await DistributionComplaintsDAO.dcmForwordComplaintDao(id)
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

exports.dcmAddComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { category, complaint } = await DistributionComplaintsValidate.dcmAddComplaintSchema.validateAsync(req.body);
        const officerId = req.user.userId

        console.log(category, complaint, officerId)

        const result = await DistributionComplaintsDAO.dcmAddComplaintDao(officerId, category, complaint);
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

exports.dcmGetAllSentComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const companyId = req.user.companyId

        const { page, limit, searchText, status, emptype } = await DistributionComplaintsValidate.dcmGetAllSentComplaintsSchema.validateAsync(req.query);

        const { items, total } = await DistributionComplaintsDAO.dcmGetAllSendComplainDao(userId, companyId, page, limit, status, emptype, searchText)

        return res.status(200).json({ items, total, userId });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.dcmGetRecivedReplyByComplaintId = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const companyId = req.user.companyId
        const { id } = await DistributionComplaintsValidate.dcmGetparmasIdSchema.validateAsync(req.params);
        const result = await DistributionComplaintsDAO.dcmGetReciveReplyByComplaintIdDao(id, )
        const templateData = await DistributionComplaintsDAO.dcmGetComplainTemplateDataDao(userId)
        const managerData = await DistributionComplaintsDAO.getDCMDetailsDao(userId)
        console.log('managerData', managerData)


        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false, data: result[0], dcmData: managerData[0], template: templateData });
        }

        res.status(200).json({ message: "Data found!", status: true, data: result[0], dcmData: managerData[0],  template: templateData });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.getAllRecivedDCHComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const companyId = req.user.companyId
        const { page, limit, searchText, status } = await DistributionComplaintsValidate.getAllDCHRecievedComplaintsSchema.validateAsync(req.query);
        const { items, total } = await DistributionComplaintsDAO.getAllRecivedDCHComplainDao(companyId, page, limit, status, searchText)
        return res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.dchGetRecivedComplainById = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const { id } = await DistributionComplaintsValidate.dchGetparmasIdSchema.validateAsync(req.params);
        const result = await DistributionComplaintsDAO.dchGetReciveReplyByIdDao(id)
        const templateData = await DistributionComplaintsDAO.dchGetComplainTemplateDataDao(userId)


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

exports.DCHReplyComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const complain = await DistributionComplaintsValidate.dchReplyComplainSchema.validateAsync(req.body)
        const result = await DistributionComplaintsDAO.DCHReplyComplainDao(complain)
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

exports.DCHForwordComplaintToAdmin = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { id } = await DistributionComplaintsValidate.dchGetparmasIdSchema.validateAsync(req.params);

        const result = await DistributionComplaintsDAO.DCHForwordComplaintToAdminDao(id)
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

exports.getAllSentDCHComplaint = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const userId = req.user.userId
        const companyId = req.user.companyId

        const { page, limit, searchText, status, emptype } = await DistributionComplaintsValidate.getAllDCHSentComplaintsSchema.validateAsync(req.query);

        const { items, total } = await DistributionComplaintsDAO.getAllSendDCHComplainDao(userId, companyId, page, limit, status, emptype, searchText)
        return res.status(200).json({ items, total, userId });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}

exports.addComplaintDCH = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    try {
        const { category, complaint } = await DistributionComplaintsValidate.DCHAddComplaintSchema.validateAsync(req.body);
        const officerId = req.user.userId

        const result = await DistributionComplaintsDAO.addComplaintDCHDao(officerId, category, complaint);

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