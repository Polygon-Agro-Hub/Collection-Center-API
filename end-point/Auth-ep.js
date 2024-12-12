const AuthValidate = require('../validations/Auth-validation')
const AuthDAO =  require('../dao/Auth-dao')

exports.test = async (req, res) => {
    try {
        //   const { page, limit, searchItem } =
        //     await ValidateSchema.getAllUsersSchema.validateAsync(req.query);
        res.json("Auth test");
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.details[0].message });
        }
        console.error("Error executing query:", err);
        res.status(500).send("An error occurred while fetching data.");
    }
};