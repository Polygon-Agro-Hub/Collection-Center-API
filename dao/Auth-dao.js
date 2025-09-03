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


exports.getUserDAO = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT 
        COF.firstNameEnglish,
        COF.lastNameEnglish,
        COF.email,
        COF.nic,
        COF.phoneNumber01,
        COF.phoneNumber02,
        COF.phoneCode01,
        COF.phoneCode02,
        COF.houseNumber,
        COF.city,
        COF.province,
        COF.streetName,
        COF.country,
        COF.district,
        COF.bankName,
        COF.accNumber,
        COF.branchName,
        COF.image,
        COF.accHolderName,
        COF.jobRole,
        COF.empId,
        COM.companyNameEnglish,
        CEN.centerName
    FROM 
        collectionofficer COF
    LEFT JOIN 
        company COM ON COF.companyId = COM.id
    LEFT JOIN 
        collectioncenter CEN ON COF.centerId = CEN.id
    WHERE 
        COF.id = ?`;

    collectionofficer.query(sql, [userId], (err, results) => {
      if (err) {
        return reject(err); // Reject promise if an error occurs
      }

      if (results.length === 0) {
        return resolve(null); // No officer found
      }

      const officer = results[0];

      resolve({
        collectionOfficer: {
          id: officer.id,
          firstNameEnglish: officer.firstNameEnglish,
          lastNameEnglish: officer.lastNameEnglish,
          phoneNumber01: officer.phoneNumber01,
          phoneNumber02: officer.phoneNumber02,
          nic: officer.nic,
          email: officer.email,
          passwordUpdated: officer.passwordUpdated,
          houseNumber: officer.houseNumber,
          streetName: officer.streetName,
          city: officer.city,
          district: officer.district,
          province: officer.province,
          country: officer.country,
          languages: officer.languages,
          empId: officer.empId,
          jobRole: officer.jobRole,
          employeeType: officer.empType,
          accHolderName: officer.accHolderName,
          accNumber: officer.accNumber,
          bankName: officer.bankName,
          branchName: officer.branchName,
          image: officer.image,
          companyNameEnglish: officer.companyNameEnglish,
          centerName: officer.centerName,
          phoneCode01: officer.phoneCode01,
          phoneCode02: officer.phoneCode02



        },
      });
    });
  });
};


exports.getCompanyImages = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
            SELECT 
                logo, favicon
            FROM 
                company
           WHERE
                id = ?`;

    collectionofficer.query(sql, [id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};