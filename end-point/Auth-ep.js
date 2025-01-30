const AuthValidate = require('../validations/Auth-validation')
const AuthDAO = require('../dao/Auth-dao')
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
    console.log(user);
    

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    if (user.jobRole !== 'Collection Center Manager' && user.jobRole !== 'Collection Center Head') {
      return res.status(401).json({ error: "User have not access for this web" });
    }

    if (user.status != 'Approved') {
      return res.status(401).json({ error: "Not a approved user" });
    }

    if (user) {
      console.log(user.password, password);


      verify_password = bcrypt.compareSync(password, user.password);

      if (!verify_password) {
        return res.status(401).json({ error: "Wrong password." });
      }

      if (verify_password) {
        const token = jwt.sign(
          { userId: user.id, role: user.jobRole, centerId: user.centerId, companyId: user.companyId },
          process.env.JWT_SECRET,
          { expiresIn: "5h" }
        );

        console.log("Token--- ",token);

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

exports.updatePassword = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('Request URL:', fullUrl);

  try {
    const { password } = await AuthValidate.logInUpdate.validateAsync(req.body);
    const id = req.user.userId;

    // Log the incoming values for debugging
    console.log('Received ID:', id);
    console.log('Received newPassword:', password);

    if (!password) {
      return res.status(400).json({ error: "newPassword is required." });
    }

    // Encrypt the new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
    console.log('Hashed Password:', hashedPassword);

    // Call the DAO function to update the password
    const result = await AuthDAO.updatePasswordDAO(id, hashedPassword);

    if (result.affectedRows === 0) {
      return res.json({ message: "User not found or no changes were made.", status: false });
    }
    res.status(200).json({ message: "Password updated successfully.", status: true });
  } catch (err) {
    console.error("Error during password update:", err);
    res.status(500).json({ error: "An error occurred during password update." });
  }
};


exports.test = async (req, res) => {
  try {
    
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({ error: err.details[0].message });
    }
    console.error("Error executing query:", err);
    res.status(500).send("An error occurred while fetching data.");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming the user ID is stored in the token payload
    console.log("User ID:", userId);

    const officerData = await AuthDAO.getUserDAO(userId);

    if (!officerData || officerData.length === 0) {
      return res.status(404).json({ error: "officer not found" });
    }

    // // Extracting first name and last name
    // const firstName = user[0].firstNameEnglish;
    // const lastName = user[0].firstNameSinhala;

    // // Logging the fetched data
    // console.log("First Name:", firstName);
    // console.log("Last Name:", lastName);

    res.status(200).json({ officerData });
    console.log(officerData);
  } catch (error) {
    console.error("Error fetching officer profile:", error);
    res.status(500).json({ error: "An error occurred while fetching the usofficer profile" });
  }
};


