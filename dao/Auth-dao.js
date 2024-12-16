// exports.GetAllCenterDAO = () => {
//     return new Promise((resolve, reject) => {
//       const sql = "SELECT * FROM collectioncenter";
//       db.query(sql, (err, results) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(results);
//       });
//     });
//   };
const db = require("../startup/database");

exports.loginUser = (userName) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                co.*, 
                cocd.jobRole, 
                cocd.empId 
            FROM 
                collectionofficer AS co
            LEFT JOIN 
                collectionofficercompanydetails AS cocd
            ON 
                co.id = cocd.collectionOfficerId
            WHERE 
                cocd.empId = ?`;
        
        db.query(sql, [userName], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
