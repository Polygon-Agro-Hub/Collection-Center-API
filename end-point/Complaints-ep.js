const ComplaintValidate = require('../validations/Complaints-validation')
const ComplaintDAO = require('../dao/Complaints-dao')


exports.getAllRecivedComplain = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);

    try {
        const userId = req.user.userId
        console.log(userId);
        const { page, limit, searchText, status } = await ComplaintValidate.getAllDailyTargetSchema.validateAsync(req.query);
        console.log(page, limit, searchText, status);


        const { items, total } = await ComplaintDAO.getAllRecivedComplainDao(userId, page, limit, status, searchText)

        console.log("Successfully fetched recived complaind");
        return res.status(200).json({ items, total });
    } catch (error) {
        if (error.isJoi) {
            // Handle validation error
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}