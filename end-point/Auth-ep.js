const AuthValidate = require('../validations/Auth-validation')
const AuthDAO =  require('../dao/Auth-dao')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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



exports.loginUser = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log(fullUrl);
  
    try {
      await AuthValidate.loginUserSchema.validateAsync(req.body);
  
      const { userName, password } = req.body;
      const [user] = await AuthDAO.loginUser(userName);
      let verify_password;
  
      if (!user) {
        return res.status(401).json({ error: "User not found." });
      }

      if (user.jobRole != 'Collection Center Head') {
        return res.status(401).json({ error: "User have not access for this web" });
      }

      if (user.status != 'Approved') {
        return res.status(401).json({ error: "Not a approved user" });
      }

      if (user) {
        if (user.passwordUpdated == 1) {
            verify_password = bcrypt.compareSync(password, user.password);
          }else{
            verify_password = password === user.password;
          }
  
        if (!verify_password) {
          return res.status(401).json({ error: "Wrong password." });
        }
  
        if (verify_password) {
          const token = jwt.sign(
            { userId: user.id, role: user.jobRole },
            process.env.JWT_SECRET,
            { expiresIn: "5h" }
          );
  
          const data = {
            token,
            userId: user.id,
            role: user.jobRole,
            userName: user.empId,
            updatedPassword: user.passwordUpdated,
          };
  
          return res.json(data);
        }
      }
  
      res.status(401).json({ error: "Invalid email or password." });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "An error occurred during login." });
    }
  };