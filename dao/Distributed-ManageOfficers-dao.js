const { plantcare, collectionofficer, marketPlace, dash, admin } = require('../startup/database');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const uploadFileToS3 = require('../middlewares/s3upload');
const deleteFromS3 = require('../middlewares/s3delete');
const path = require("path");

exports.getAllOfficersDAO = (centerId, page, limit, status, role, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.distributedCenterId = ?
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.image,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.phoneCode01,
                        Coff.phoneCode02,
                        Coff.empId,
                        Coff.jobRole,
                        Coff.phoneNumber01,
                        Coff.phoneNumber02,
                        Coff.nic,
                        Coff.district,
                        Coff.status
                     FROM collectionofficer Coff
                     WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.distributedCenterId = ?

                 `;

        const countParams = [centerId];
        const dataParams = [centerId];

        // Apply filters for company ID
        if (status) {
            countSql += " AND Coff.status LIKE ?";
            dataSql += " AND Coff.status LIKE ?";
            countParams.push(status);
            dataParams.push(status);
        }

        if (role) {
            countSql += " AND Coff.jobRole LIKE ?";
            dataSql += " AND Coff.jobRole LIKE ?";
            countParams.push(role);
            dataParams.push(role);
        }

        // Apply search filters for NIC or related fields
        if (searchText) {
            const searchCondition = `
                AND (
                    Coff.nic LIKE ?
                    OR Coff.firstNameEnglish LIKE ?
                    OR Coff.lastNameEnglish LIKE ?
                    OR Coff.empId LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue, searchValue, searchValue);
            dataParams.push(searchValue, searchValue, searchValue, searchValue);
        }

        dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'CCM%' THEN 0 ELSE 1 END";


        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

        // Execute count query
        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0].total;

            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                resolve({ items: dataResults, total });
            });
        });
    });
};

exports.getAllOfficersForDCHDAO = (companyId, page, limit, status, role, searchText, center) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ?
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.image,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.phoneCode01,
                        Coff.phoneCode02,
                        Cen.centerName,
                        Coff.empId,
                        Coff.jobRole,
                        Coff.phoneNumber01,
                        Coff.phoneNumber02,
                        Coff.nic,
                        Coff.district,
                        Coff.status
                     FROM collectionofficer Coff, distributedcenter Cen 
                     WHERE Coff.distributedCenterId = Cen.id AND (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ?

                 `;

        const countParams = [companyId];
        const dataParams = [companyId];

        // Apply filters for company ID
        if (center) {
            countSql += " AND Coff.distributedCenterId = ? ";
            dataSql += " AND Coff.distributedCenterId = ? ";
            countParams.push(center);
            dataParams.push(center);
        }

        if (status) {
            countSql += " AND Coff.status LIKE ? ";
            dataSql += " AND Coff.status LIKE ? ";
            countParams.push(status);
            dataParams.push(status);
        }

        if (role) {
            countSql += " AND Coff.jobRole LIKE ? ";
            dataSql += " AND Coff.jobRole LIKE ? ";
            countParams.push(role);
            dataParams.push(role);
        }

        // Apply search filters for NIC or related fields
        if (searchText) {
            const searchCondition = `
                AND (
                    Coff.nic LIKE ?
                    OR Coff.firstNameEnglish LIKE ?
                    OR Coff.lastNameEnglish LIKE ?
                    OR Coff.empId LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue, searchValue, searchValue);
            dataParams.push(searchValue, searchValue, searchValue, searchValue);
        }

        // dataSql += " ORDER BY Coff.createdAt DESC ";
        dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'DCH%' THEN 0 ELSE 1 END";


        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

        // Execute count query
        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0].total;

            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                resolve({ items: dataResults, total });
            });
        });
    });
};


exports.getAllCompanyNamesDao = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, companyNameEnglish
            FROM company
            WHERE isDistributed = 1
        `;
        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getDCHOwnCenters = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CC.id, CC.centerName, CC.regCode
            FROM distributedcenter CC, distributedcompanycenter COMC
            WHERE COMC.centerId = CC.id AND COMC.companyId = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                console.log('Error in getDCHOwnCenters query:', err);
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getDistributionCenterManagerDao = (companyId, centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, firstNameEnglish, lastNameEnglish
            FROM collectionofficer
            WHERE companyId = ? AND distributedCenterId = ? AND empId LIKE 'DCM%'
        `;

        collectionofficer.query(sql, [companyId, centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getForCreateIdDao = (role) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT empId FROM collectionofficer WHERE empId LIKE ? ORDER BY empId DESC LIMIT 1";
        collectionofficer.query(sql, [`${role}%`], (err, results) => {
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

exports.checkExistOfficersDao = (nic) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM collectionofficer
            WHERE nic = ?
        `;

        collectionofficer.query(sql, [nic], (err, results) => {
            if (err) {
                return reject(err);
            }
            let validationResult = false;
            if (results.length > 0) {
                validationResult = true;
            }
            resolve(validationResult);
        });
    });
};

exports.checkExistEmailsDao = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM collectionofficer
            WHERE email = ?
        `;

        collectionofficer.query(sql, [email], (err, results) => {
            if (err) {
                return reject(err);
            }
            let validationResult = false;
            if (results.length > 0) {
                validationResult = true;
            }
            resolve(validationResult);
        });
    });
};

exports.checkExistPhoneDao = (phone1) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM collectionofficer
            WHERE phoneNumber01 = ? OR phoneNumber02 = ?
        `;

        collectionofficer.query(sql, [phone1, phone1], (err, results) => {
            if (err) {
                return reject(err);
            }
            let validationResult = false;
            if (results.length > 0) {
                validationResult = true;
            }
            resolve(validationResult);
        });
    });
};

exports.checkExistPhone2Dao = (phone2) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM collectionofficer
            WHERE phoneNumber01 = ? OR phoneNumber02 = ?
        `;

        collectionofficer.query(sql, [phone2, phone2], (err, results) => {
            if (err) {
                return reject(err);
            }
            const validationResult = results.length > 0;
            resolve(validationResult);
        });
    });
};

exports.createCollectionOfficerPersonal = (officerData, centerId, companyId, managerID, image, lastId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }

            // Generate QR Code
            const qrData = JSON.stringify({ empId: officerData.empId });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empId}.png`, "distributionofficer/QRcode");


            // Define SQL Query before execution
            const sql = `
                INSERT INTO collectionofficer (
                    distributedCenterId, companyId, irmId, 
                    firstNameEnglish, firstNameSinhala, firstNameTamil, 
                    lastNameEnglish, lastNameSinhala, lastNameTamil, 
                    jobRole, empId, empType, 
                    phoneCode01, phoneNumber01, phoneCode02, phoneNumber02, 
                    nic, email, passwordUpdated, houseNumber, streetName, city, 
                    district, province, country, languages, 
                    accHolderName, accNumber, bankName, branchName, 
                    status, image, QRcode
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Approved', ?, ?)
            `;

            // Execute SQL Query
            collectionofficer.query(
                sql,
                [
                    officerData.centerId,
                    companyId,
                    officerData.jobRole === 'Distribution Manager' ? null : officerData.irmId,
                    officerData.firstNameEnglish,
                    officerData.firstNameSinhala,
                    officerData.firstNameTamil,
                    officerData.lastNameEnglish,
                    officerData.lastNameSinhala,
                    officerData.lastNameTamil,
                    officerData.jobRole,
                    lastId,
                    officerData.employeeType,
                    officerData.phoneNumber01Code,
                    officerData.phoneNumber01,
                    officerData.phoneNumber02Code,
                    officerData.phoneNumber02,
                    officerData.nic,
                    officerData.email,
                    0,
                    officerData.houseNumber,
                    officerData.streetName,
                    officerData.city,
                    officerData.district,
                    officerData.province,
                    officerData.country,
                    officerData.languages,
                    officerData.accHolderName,
                    officerData.accNumber,
                    officerData.bankName,
                    officerData.branchName,
                    image,
                    qrcodeURL
                ],
                (err, results) => {
                    if (err) {
                        console.error("Database Error:", err);
                        return reject(err);
                    }
                    resolve(results);
                }
            );
        } catch (error) {
            console.error("Error:", error);
            reject(error);
        }
    });
};

exports.getCCIDforCreateEmpIdDao = (employee) => {
    console.log('employee', employee)
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT empId 
        FROM collectionofficer
        WHERE jobRole = ?
        ORDER BY 
          CAST(SUBSTRING(empId FROM 4) AS UNSIGNED) DESC
        LIMIT 1
      `;
      const values = [employee];
  
      collectionofficer.query(sql, values, (err, results) => {
        if (err) {
          return reject(err);
        }
  
        if (results.length === 0) {
          if (employee === "Collection Center Head") {
            return resolve("CCH00001");
          } else if (employee === "Collection Center Manager") {
            return resolve("CCM00001");
          } else if (employee === "Collection Officer") {
            return resolve("COO00001");
          } else if (employee === "Distribution Manager") {
            return resolve("DCM00001");
          }
            else if (employee === "Distribution Office") {
            return resolve("DIO00001");
          }
        }
        console.log('results', results)
  
        const highestId = results[0].empId;
  
        const prefix = highestId.substring(0, 3); // e.g., "CCM"
        const numberStr = highestId.substring(3); // e.g., "00007"
        const number = parseInt(numberStr, 10);
  
        const nextNumber = number + 1;
        const nextId = `${prefix}${nextNumber.toString().padStart(5, "0")}`; // e.g., "CCM00008"
        console.log('nextId', nextId)
  
        resolve(nextId);
      });
    });
  };

  exports.getOfficerByIdDAO = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COF.*,
                COM.companyNameEnglish,
                DC.centerName
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id
            LEFT JOIN 
            distributedcenter DC ON COF.distributedCenterId = DC.id
            WHERE 
                COF.id = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length === 0) {
                return resolve(null);
            }
            const officer = results[0];
            console.log('officer', officer)
            const empIdWithoutPrefix = officer.empId ? officer.empId.substring(3) : null;
            const empIdPrefix = officer.empId ? officer.empId.substring(0, 3) : null;
            const empIdWithPrefix = officer.empId;

            resolve({
                collectionOfficer: {
                    id: officer.id,
                    firstNameEnglish: officer.firstNameEnglish,
                    firstNameSinhala: officer.firstNameSinhala,
                    firstNameTamil: officer.firstNameTamil,
                    lastNameEnglish: officer.lastNameEnglish,
                    lastNameSinhala: officer.lastNameSinhala,
                    lastNameTamil: officer.lastNameTamil,
                    phoneNumber01: officer.phoneNumber01,
                    phoneNumber02: officer.phoneNumber02,
                    phoneCode01: officer.phoneCode01,
                    phoneCode02: officer.phoneCode02,
                    image: officer.image,
                    QRcode: officer.QRcode,
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
                    empId: empIdWithoutPrefix,
                    empIdPrefix: empIdWithPrefix,
                    empIdFirst: empIdPrefix,
                    jobRole: officer.jobRole,
                    employeeType: officer.empType,
                    accHolderName: officer.accHolderName,
                    accNumber: officer.accNumber,
                    bankName: officer.bankName,
                    branchName: officer.branchName,
                    companyNameEnglish: officer.companyNameEnglish,
                    centerName: officer.centerName,
                    centerId: officer.distributedCenterId,
                    companyId: officer.companyId,
                    irmId: officer.irmId,
                   
                }
               
            });
        });
    });
};

exports.getCenterName = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT centerName
            FROM distributedcenter
            WHERE id = ? 
        `;

        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
}


exports.updateOfficerDetails = (id, officerData, image) => {
    console.log('officer data', officerData )
    return new Promise(async (resolve, reject) => {

        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }

            let qrcodeURL = officerData.previousQR || '';

            // Generate QR Code
            if (officerData.empIdPrefix !== officerData.previousEmpId) {
                    console.log('empIdPrefix', officerData.empIdPrefix, 'previousEmpId', officerData.previousEmpId )
                    await deleteFromS3(officerData.previousQR);

                    const qrData = JSON.stringify({ empId: officerData.empIdPrefix });
                    const qrCodeBase64 = await QRCode.toDataURL(qrData);
                    const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
                    qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empIdPrefix}.png`, "distributionofficer/QRcode");
                    console.log('qrcodeURL', qrcodeURL)
                    const isprevious = qrcodeURL == officerData.previousQR
                    console.log('isprevious', isprevious)
            }
            // await deleteFromS3(officerData.previousQR);

            // const qrData = JSON.stringify({ empId: officerData.empId });
            // const qrCodeBase64 = await QRCode.toDataURL(qrData);
            // const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            // const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empId}.png`, "distributionofficer/QRcode");

            // console.log('officer dat', officerData )



            // Define SQL Query before execution
            const sql = `
                UPDATE collectionofficer
                SET firstNameEnglish = ?,
                    firstNameSinhala = ?,
                    firstNameTamil = ?,
                    lastNameEnglish = ?,
                    lastNameSinhala = ?,
                    lastNameTamil = ?,
                    jobRole = ?,
                    empId = ?,
                    empType = ?,
                    phoneCode01 = ?,
                    phoneNumber01 = ?,
                    phoneCode02 = ?,
                    phoneNumber02 = ?,
                    distributedCenterId = ?,
                    nic = ?,
                    email = ?,
                    irmId = ?,
                    password = ?,
                    passwordUpdated = ?,
                    houseNumber = ?,
                    streetName = ?,
                    city = ?,
                    district = ?,
                    province = ?,
                    country = ?,
                    languages = ?,
                    accHolderName = ?,
                    accNumber = ?,
                    bankName = ?,
                    branchName = ?,
                    status = ?,
                    image = ?,
                    QRcode = ?
                WHERE id = ?
            `;

            const updateOfficerParams = [
                officerData.firstNameEnglish,
                officerData.firstNameSinhala,
                officerData.firstNameTamil,
                officerData.lastNameEnglish,
                officerData.lastNameSinhala,
                officerData.lastNameTamil,
                officerData.jobRole,
                officerData.empIdPrefix,
                officerData.employeeType,
                officerData.phoneCode01,
                officerData.phoneNumber01,
                officerData.phoneCode02,
                officerData.phoneNumber02,
                officerData.centerId,
                officerData.nic,
                officerData.email,
                officerData.irmId,
                null,
                0,
                officerData.houseNumber,
                officerData.streetName,
                officerData.city,
                officerData.district,
                officerData.province,
                officerData.country,
                officerData.languages,
                officerData.accHolderName,
                officerData.accNumber,
                officerData.bankName,
                officerData.branchName,
                "Not Approved",
                image,
                qrcodeURL,
                parseInt(id),
            ];

            // Execute SQL Query
            collectionofficer.query(
                sql, updateOfficerParams,
                (err, results) => {
                    if (err) {
                        console.error("Database Error:", err);
                        return reject(err);
                    }
                    resolve(results);
                }
            );
        } catch (error) {
            console.error("Error:", error);
            reject(error);
        }
    });
};
  
