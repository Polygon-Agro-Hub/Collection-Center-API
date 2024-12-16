const db = require("../startup/database");

exports.GetAllCenterDAO = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM collectioncenter";
        db.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getForCreateIdDao = (role) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT empId FROM collectionofficercompanydetails WHERE empId LIKE ? ORDER BY empId DESC LIMIT 1";
        db.query(sql, [`${role}%`], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                const numericPart = parseInt(results[0].empId.substring(3), 10);

                const incrementedValue = numericPart + 1;

                results[0].empId = incrementedValue.toString().padStart(5, '0');
            }



            resolve(results);
        });
    });
};