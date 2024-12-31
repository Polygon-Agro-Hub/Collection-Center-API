const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.loginUser = (userName) => {
  return new Promise((resolve, reject) => {
    const sql = `
            SELECT 
                *
            FROM 
                collectionofficer
           WHERE
                empId = ?`;

    collectionofficer.query(sql, [userName], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

exports.updatePasswordDAO = (id, hashedPassword) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `
                UPDATE 
                    collectionofficer
                SET  
                    password = ?,
                    passwordUpdated = 1
                WHERE 
                    id = ?`;

      collectionofficer.query(sql, [hashedPassword, id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
