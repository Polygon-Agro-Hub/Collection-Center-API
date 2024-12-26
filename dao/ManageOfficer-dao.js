const db = require("../startup/database");
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
        const sql = "SELECT empId FROM collectionofficer WHERE empId LIKE ? ORDER BY empId DESC LIMIT 1";
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


exports.createCollectionOfficerPersonal = (officerData, centerId, companyId, managerID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = `
                INSERT INTO collectionofficer (centerId, companyId, irmId, 
                    firstNameEnglish, firstNameSinhala, firstNameTamil, lastNameEnglish, lastNameSinhala, lastNameTamil, 
                    jobRole, empId, empType, phoneCode01, phoneNumber01, phoneCode02, phoneNumber02, 
                    nic, email, passwordUpdated, houseNumber, streetName, city, district, province, country, languages, 
                    accHolderName, accNumber, bankName, branchName, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  'Not Approved')
            `;

            // Database query with QR image data added
            db.query(
                sql,
                [
                    centerId,
                    companyId,
                    managerID,
                    officerData.firstNameEnglish,
                    officerData.firstNameSinhala,
                    officerData.firstNameTamil,
                    officerData.lastNameEnglish,
                    officerData.lastNameSinhala,
                    officerData.lastNameTamil,
                    officerData.jobRole,
                    officerData.empId,
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

        if (companyData.collectionManagerId === '') {
            companyData.collectionManagerId = null;
        }

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


exports.getAllOfficersDAO = (page, limit, company, role, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff, company Com 
            WHERE Coff.companyId = Com.id 
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.image,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.phoneCode01,
                        Coff.phoneCode02,
                        Com.companyNameEnglish,
                        Coff.empId,
                        Coff.jobRole,
                        Coff.phoneNumber01,
                        Coff.phoneNumber02,
                        Coff.nic,
                        Coff.district,
                        Coff.status
                     FROM collectionofficer Coff, company Com 
                     WHERE Coff.companyId = Com.id 

                 `;

        const countParams = [];
        const dataParams = [];

        // Apply filters for company ID
        if (company) {
            countSql += " AND Com.companyNameEnglish LIKE ?";
            dataSql += " AND Com.companyNameEnglish LIKE ?";
            countParams.push(company);
            dataParams.push(company);
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

        dataSql += " ORDER BY Coff.createdAt DESC ";

        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ?";
        dataParams.push(limit, offset);

        // Execute count query
        db.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0].total;

            // Execute data query
            db.query(dataSql, dataParams, (dataErr, dataResults) => {
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
            GROUP BY companyNameEnglish
        `;
        db.query(sql, (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            resolve(results); // Resolve the promise with the query results
        });
    });
};



exports.DeleteOfficerDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE FROM collectionofficer
            WHERE id = ?
        `;
        db.query(sql, [parseInt(id)], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            resolve(results); // Resolve the promise with the query results
        });
    });
};


exports.getCollectionOfficerEmailDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT c.email, c.firstNameEnglish, ccd.empId AS empId
            FROM collectionofficer c
            LEFT JOIN collectionofficercompanydetails ccd ON c.id = ccd.collectionOfficerId
            WHERE c.id = ?
        `;
        db.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            if (results.length > 0) {
                resolve({
                    email: results[0].email, // Resolve with email
                    firstNameEnglish: results[0].firstNameEnglish,
                    empId: results[0].empId, // Resolve with employeeType (empId)
                });
            } else {
                resolve(null); // Resolve with null if no record is found
            }
        });
    });
};

exports.UpdateCollectionOfficerStatusAndPasswordDao = (params) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE collectionofficer
            SET status = ?, password = ?, passwordUpdated = 0
            WHERE id = ?
        `;
        db.query(sql, [params.status, params.password, parseInt(params.id)], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            resolve(results); // Resolve with the query results
        });
    });
};


exports.SendGeneratedPasswordDao = async (email, password, empId, firstNameEnglish) => {
    try {

        const doc = new PDFDocument();

        const pdfPath = `./uploads/register_details_${empId}.pdf`;

        doc.pipe(fs.createWriteStream(pdfPath));

        const watermarkPath = './assets/bg.png';
        doc.opacity(0.2)
            .image(watermarkPath, 100, 300, { width: 400 })
            .opacity(1);

        doc.fontSize(20)
            .fillColor('#071a51')
            .text('Welcome to AgroWorld (Pvt) Ltd - Registration Confirmation', {
                align: 'center',
            });

        doc.moveDown();

        const lineY = doc.y;

        doc.moveTo(50, lineY)
            .lineTo(550, lineY)
            .stroke();

        doc.moveDown();

        doc.fontSize(12).text(`Dear ${firstNameEnglish},`);

        doc.moveDown();

        doc.fontSize(12).text('Thank you for registering with us! We are excited to have you on board.');

        doc.moveDown();

        doc.fontSize(12)
            .text(
                'You have successfully created an account with AgroWorld (Pvt) Ltd. Our platform will help you with all your agricultural needs, providing guidance, weather reports, asset management tools, and much more. We are committed to helping farmers like you grow and succeed.',
                {
                    align: 'justify',
                }
            );

        doc.moveDown();

        doc.fontSize(12).text(`Your User Name/ID: ${empId}`);
        doc.fontSize(12).text(`Your Password: ${password}`);

        doc.moveDown();

        doc.fontSize(12)
            .text(
                'If you have any questions or need assistance, feel free to reach out to our support team at info@agroworld.lk',
                {
                    align: 'justify',
                }
            );

        doc.moveDown();

        doc.fontSize(12)
            .text(
                'We are here to support you every step of the way!',
                {
                    align: 'justify',
                }
            );

        doc.moveDown();
        doc.fontSize(12).text(`Best Regards,`);
        doc.fontSize(12).text(`The AgroWorld Team`);
        doc.fontSize(12).text(`AgroWorld (Pvt) Ltd. | All rights reserved.`);
        doc.moveDown();
        doc.fontSize(12).text(`Address: No:14,`);
        doc.fontSize(12).text(`            Sir Baron Jayathilake Mawatha,`);
        doc.fontSize(12).text(`            Colombo 01.`);
        doc.moveDown();
        doc.fontSize(12).text(`Email: info@agroworld.lk`);

        doc.end();

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,  // or 587 for TLS
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                family: 4,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to AgroWorld (Pvt) Ltd - Registration Confirmation',
            text: `Dear ${firstNameEnglish},\n\nYour registration details are attached in the PDF.`,
            attachments: [
                {
                    filename: `password_${empId}.pdf`,  // PDF file name
                    path: pdfPath,  // Path to the generated PDF
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        return { success: true, message: 'Email sent successfully!' };

    } catch (error) {
        console.error('Error sending email:', error);

        return { success: false, message: 'Failed to send email.', error };
    }
};




exports.getOfficerByIdDAO = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                co.*, 
                cocd.companyNameEnglish, cocd.companyNameSinhala, cocd.companyNameTamil,
                cocd.jobRole, cocd.collectionManagerId, cocd.companyEmail, cocd.assignedDistrict, cocd.employeeType, cocd.empId,
                cobd.accHolderName, cobd.accNumber, cobd.bankName, cobd.branchName
            FROM 
                collectionofficer co
            LEFT JOIN 
                collectionofficercompanydetails cocd ON co.id = cocd.collectionOfficerId
            LEFT JOIN 
                collectionofficerbankdetails cobd ON co.id = cobd.collectionOfficerId
            WHERE 
                co.id = ?`;

        db.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }

            if (results.length === 0) {
                return resolve(null); // No officer found
            }

            const officer = results[0];

            // Process image field if present
            if (officer.image) {
                const base64Image = Buffer.from(officer.image).toString("base64");
                officer.image = `data:image/png;base64,${base64Image}`;
            }

            // Process QRcode field if present
            if (officer.QRcode) {
                const base64QRcode = Buffer.from(officer.QRcode).toString("base64");
                officer.QRcode = `data:image/png;base64,${base64QRcode}`;
            }

            const empIdWithoutPrefix = officer.empId ? officer.empId.substring(3) : null;

            resolve({
                collectionOfficer: {
                    id: officer.id,
                    centerId: officer.centerId,
                    firstNameEnglish: officer.firstNameEnglish,
                    firstNameSinhala: officer.firstNameSinhala,
                    firstNameTamil: officer.firstNameTamil,
                    lastNameEnglish: officer.lastNameEnglish,
                    lastNameSinhala: officer.lastNameSinhala,
                    lastNameTamil: officer.lastNameTamil,
                    phoneNumber01: officer.phoneNumber01,
                    phoneNumber02: officer.phoneNumber02,
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
                },
                companyDetails: {
                    companyNameEnglish: officer.companyNameEnglish,
                    companyNameSinhala: officer.companyNameSinhala,
                    companyNameTamil: officer.companyNameTamil,
                    jobRole: officer.jobRole,
                    collectionManagerId: officer.collectionManagerId,
                    companyEmail: officer.companyEmail,
                    assignedDistrict: officer.assignedDistrict,
                    employeeType: officer.employeeType,
                    empId: empIdWithoutPrefix,
                },
                bankDetails: {
                    accHolderName: officer.accHolderName,
                    accNumber: officer.accNumber,
                    bankName: officer.bankName,
                    branchName: officer.branchName,
                },
            });
        });
    });
};


exports.updateOfficerDetails = (id, officerData, companyData, bankData) => {
    return new Promise((resolve, reject) => {


        db.beginTransaction((err) => {
            if (err) return reject(err);

            const updateOfficerSQL = `
                UPDATE collectionofficer
                SET centerId = ?, firstNameEnglish = ?, lastNameEnglish = ?, firstNameSinhala = ?, lastNameSinhala = ?,
                    firstNameTamil = ?, lastNameTamil = ?, nic = ?, email = ?, houseNumber = ?, streetName = ?, city = ?,
                    district = ?, province = ?, country = ? , languages = ? , status = 'Not Approved'
                WHERE id = ?
            `;

            const updateOfficerParams = [
                officerData.centerId,
                officerData.firstNameEnglish,
                officerData.lastNameEnglish,
                officerData.firstNameSinhala,
                officerData.lastNameSinhala,
                officerData.firstNameTamil,
                officerData.lastNameTamil,
                officerData.nic,
                officerData.email,
                officerData.houseNumber,
                officerData.streetName,
                officerData.city,
                officerData.district,
                officerData.province,
                officerData.country,
                officerData.languages,
                parseInt(id),
            ];

            const updateBankDetailsSQL = `
                UPDATE collectionofficerbankdetails
                SET accHolderName = ?, accNumber = ?, bankName = ?, branchName = ?
                WHERE collectionOfficerId = ?
            `;

            const updateBankDetailsParams = [
                bankData.accHolderName,
                bankData.accNumber,
                bankData.bankName,
                bankData.branchName,
                parseInt(id),
            ];

            if (companyData.collectionManagerId === '') {
                companyData.collectionManagerId = null;
            }

            let updateCompanyDetailsSQL = `
    UPDATE collectionofficercompanydetails
    SET companyNameEnglish = ?, companyNameSinhala = ?, companyNameTamil = ?, collectionManagerId = ?, 
        companyEmail = ?, assignedDistrict = ?, employeeType = ?
`;

            const updateCompanyDetailsParams = [
                companyData.companyNameEnglish,
                companyData.companyNameSinhala,
                companyData.companyNameTamil,
                companyData.collectionManagerId,
                companyData.companyEmail,
                companyData.assignedDistrict,
                companyData.employeeType,
            ];

            if (companyData.empId) {
                updateCompanyDetailsSQL += `, jobRole = ?, empId = ?`; // Correctly added comma
                updateCompanyDetailsParams.push(companyData.jobRole);
                updateCompanyDetailsParams.push(companyData.empId);
            }

            updateCompanyDetailsSQL += ` WHERE collectionOfficerId = ?`;
            updateCompanyDetailsParams.push(parseInt(id));




            db.query(updateOfficerSQL, updateOfficerParams, (err, result) => {
                if (err) {
                    return db.rollback(() => reject(err));
                }

                db.query(updateBankDetailsSQL, updateBankDetailsParams, (err, result) => {
                    if (err) {
                        return db.rollback(() => reject(err));
                    }

                    db.query(updateCompanyDetailsSQL, updateCompanyDetailsParams, (err, result) => {
                        if (err) {
                            return db.rollback(() => reject(err));
                        }

                        db.commit((err) => {
                            if (err) return db.rollback(() => reject(err));
                            resolve(result);
                        });
                    });
                });
            });
        });
    });
};


exports.CreateQRCodeForOfficerDao = (id) => {
    return new Promise(async (resolve, reject) => {

        const qrData = `
              {
                "id": ${id},
              }
              `;
        const qrCodeBase64 = await QRCode.toDataURL(qrData);

        const qrCodeBuffer = Buffer.from(
            qrCodeBase64.replace(/^data:image\/png;base64,/, ""),
            'base64'
        );

        const sql = `
            UPDATE collectionofficer 
            SET QRcode = ?
            WHERE id = ?
        `
        db.query(sql, [qrCodeBuffer, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};