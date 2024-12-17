const db = require("../startup/database");
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

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


exports.createCollectionOfficerPersonal = (officerData, companyData, bankData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Prepare data for QR code generation
            const qrData = `
            {
                "centerId": ${officerData.centerId},
                "firstNameEnglish": "${officerData.firstNameEnglish}",
                "firstNameEnglish": "${officerData.lastNameEnglish}",
                "phoneNumber01": ${officerData.phoneNumber01Code + officerData.phoneNumber01},
                "phoneNumber01": ${officerData.phoneNumber02Code + officerData.phoneNumber02},
                "nic": "${officerData.nic}",
                "companyNameEnglish": "${companyData.companyNameEnglish}",
                "jobRole": "${companyData.jobRole}",
                "accHolderName": "${bankData.accHolderName}",
                "accNumber": "${bankData.accNumber}",
                "bankName": "${bankData.bankName}",
                "branchName": "${bankData.branchName}",
            }
            `;

            const qrCodeBase64 = await QRCode.toDataURL(qrData);

            const qrCodeBuffer = Buffer.from(
                qrCodeBase64.replace(/^data:image\/png;base64,/, ""),
                'base64'
            );

            const sql = `
                INSERT INTO collectionofficer (
                    centerId, firstNameEnglish, firstNameSinhala, firstNameTamil, lastNameEnglish, lastNameSinhala, lastNameTamil,
                    phoneNumber01, phoneNumber02, image, QRcode, nic, email, houseNumber, streetName, city, district,
                    province, country, languages, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'Not Approved')
            `;

            // Database query with QR image data added
            db.query(
                sql,
                [
                    officerData.centerId,
                    officerData.firstNameEnglish,
                    officerData.firstNameSinhala,
                    officerData.firstNameTamil,
                    officerData.lastNameEnglish,
                    officerData.lastNameSinhala,
                    officerData.lastNameTamil,
                    officerData.phoneNumber01Code + officerData.phoneNumber01,
                    officerData.phoneNumber02Code + officerData.phoneNumber02,
                    officerData.image,
                    qrCodeBuffer,
                    officerData.nic,
                    officerData.email,
                    officerData.houseNumber,
                    officerData.streetName,
                    officerData.city,
                    officerData.district,
                    officerData.province,
                    officerData.country,
                    officerData.languages,
                ],
                (err, results) => {
                    if (err) {
                        console.log(err);

                        return reject(err);
                    }
                    resolve(results);
                }
            );
        } catch (error) {
            reject(error);
        }
    });
};


exports.createCollectionOfficerCompany = (companyData, collectionOfficerId) => {
    return new Promise((resolve, reject) => {
        const sql =
            "INSERT INTO collectionofficercompanydetails (collectionOfficerId, companyNameEnglish, companyNameSinhala, companyNameTamil, jobRole, companyEmail, assignedDistrict, employeeType, empId, collectionManagerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        db.query(
            sql,
            [
                collectionOfficerId,
                companyData.companyNameEnglish,
                companyData.companyNameSinhala,
                companyData.companyNameTamil,
                companyData.jobRole,
                companyData.companyEmail,
                companyData.assignedDistrict,
                companyData.employeeType,
                companyData.empId,
                companyData.collectionManagerId


            ], (err, results) => {
                if (err) {
                    return reject(err); // Reject promise if an error occurs
                }
                resolve(results); // Resolve the promise with the query results
            });
    });
};

exports.createCollectionOfficerBank = (bankData, collectionOfficerId) => {
    return new Promise((resolve, reject) => {
        const sql =
            "INSERT INTO collectionofficerbankdetails (collectionOfficerId, accHolderName, accNumber, bankName, branchName) VALUES (?, ?, ?, ?, ?)";

        db.query(
            sql,
            [
                collectionOfficerId,
                bankData.accHolderName,
                bankData.accNumber,
                bankData.bankName,
                bankData.branchName,
            ], (err, results) => {
                if (err) {
                    return reject(err); // Reject promise if an error occurs
                }
                resolve(results); // Resolve the promise with the query results
            });
    });
};


exports.getManagerIdByCenterIdDAO = (centerID) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT Coff.id, Coff.firstNameEnglish, Coff.lastNameEnglish FROM collectionofficer Coff, collectionofficercompanydetails Ccom WHERE Coff.id = Ccom.collectionOfficerId AND Ccom.empId LIKE 'CCM%' AND Coff.centerId = ?";
        db.query(sql, [centerID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};