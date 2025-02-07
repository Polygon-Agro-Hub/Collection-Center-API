const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const uploadFileToS3 = require('../middlewares/s3upload');
const deleteFromS3 = require('../middlewares/s3delete');

exports.GetAllCenterDAO = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM collectioncenter";
        collectionofficer.query(sql, (err, results) => {
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


exports.createCollectionOfficerPersonal = (officerData, centerId, companyId, managerID, image) => {
    return new Promise(async (resolve, reject) => {
        console.log(officerData, '------fnae----');

        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }

            console.log("Officer Data:", officerData);
            console.log("Center ID:", centerId, "Company ID:", companyId, "Manager ID:", managerID, "Image:", image);

            // Generate QR Code
            const qrData = JSON.stringify({ empId: officerData.empId });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empId}.png`, "collectionofficer/QRcode");

            console.log("QR Code URL:", qrcodeURL);

            // Define SQL Query before execution
            const sql = `
                INSERT INTO collectionofficer (
                    centerId, companyId, irmId, 
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



exports.createCollectionOfficerCompany = (companyData, collectionOfficerId) => {
    return new Promise((resolve, reject) => {
        const sql =
            "INSERT INTO collectionofficercompanydetails (collectionOfficerId, companyNameEnglish, companyNameSinhala, companyNameTamil, jobRole, companyEmail, assignedDistrict, employeeType, empId, collectionManagerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        if (companyData.collectionManagerId === '') {
            companyData.collectionManagerId = null;
        }

        collectionofficer.query(
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

        collectionofficer.query(
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


exports.getManagerIcollectionofficeryCenterIdDAO = (centerID) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT Coff.id, Coff.firstNameEnglish, Coff.lastNameEnglish FROM collectionofficer Coff, collectionofficercompanydetails Ccom WHERE Coff.id = Ccom.collectionOfficerId AND Ccom.empId LIKE 'CCM%' AND Coff.centerId = ?";
        collectionofficer.query(sql, [centerID], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllOfficersDAO = (centerId, page, limit, status, role, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff, company Com 
            WHERE Coff.companyId = Com.id AND Coff.empId NOT LIKE 'CCM%' AND Coff.centerId = ?
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
                     WHERE Coff.companyId = Com.id AND Coff.empId NOT LIKE 'CCM%' AND Coff.centerId = ?

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

        dataSql += " ORDER BY Coff.createdAt DESC ";

        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ?";
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
            GROUP BY companyNameEnglish
        `;
        collectionofficer.query(sql, (err, results) => {
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
        collectionofficer.query(sql, [parseInt(id)], (err, results) => {
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
            SELECT email, firstNameEnglish, empId, status
            FROM collectionofficer 
            WHERE id = ?
        `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            if (results.length > 0) {
                resolve({
                    email: results[0].email,
                    firstNameEnglish: results[0].firstNameEnglish,
                    empId: results[0].empId,
                    Existstatus: results[0].status
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
        collectionofficer.query(sql, [params.status, params.password, parseInt(params.id)], (err, results) => {
            if (err) {
                console.log(err);
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
                COF.*,
                COM.companyNameEnglish,
                CEN.centerName
            FROM 
                collectionofficer COF, company COM, collectioncenter CEN
            WHERE 
             COF.centerId = CEN.id AND COF.companyId = COM.id AND COF.id = ?`;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }

            if (results.length === 0) {
                return resolve(null); // No officer found
            }

            const officer = results[0];

            const empIdWithoutPrefix = officer.empId ? officer.empId.substring(3) : null;

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
                    jobRole: officer.jobRole,
                    employeeType: officer.empType,
                    accHolderName: officer.accHolderName,
                    accNumber: officer.accNumber,
                    bankName: officer.bankName,
                    branchName: officer.branchName,
                    companyNameEnglish: officer.companyNameEnglish,
                    centerName: officer.centerName



                },
            });
        });
    });
};



exports.updateOfficerDetails = (id, officerData, image) => {
    return new Promise(async (resolve, reject) => {

        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }

            console.log("Officer Data:", officerData);

            // Generate QR Code
            await deleteFromS3(officerData.previousQR);

            const qrData = JSON.stringify({ empId: officerData.empId });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empId}.png`, "collectionofficer/QRcode");

            console.log("QR Code URL:", qrcodeURL);

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
                    nic = ?,
                    email = ?,
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
                officerData.empId,
                officerData.employeeType,
                officerData.phoneCode01,
                officerData.phoneNumber01,
                officerData.phoneCode02,
                officerData.phoneNumber02,
                officerData.nic,
                officerData.email,
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

//not
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
        collectionofficer.query(sql, [qrCodeBuffer, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.disclaimOfficerDetailsDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE collectionofficer
            SET centerId = NULL, irmId = NULL, claimStatus = 0
            WHERE id = ?
        `;

        // Pass the `id` as the parameter to the query
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject the promise if an error occurs
            }
            resolve(results); // Resolve with the query results
        });
    });
};




exports.getOfficerByEmpIdDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COF.id,
                COF.firstNameEnglish, 
                COF.lastNameEnglish, 
                COF.jobRole, 
                COF.empId, 
                COM.companyNameEnglish, 
                COF.claimStatus, 
                COF.image,
                CEN.centerName
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id
            LEFT JOIN 
                collectioncenter CEN ON COF.centerId = CEN.id
            WHERE 
                COF.empId = ?;        `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.claimOfficerDao = (id, userid, centerid) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE collectionofficer
            SET centerId = ?, irmId = ?, claimStatus = ?
            WHERE id = ?
        `;
        collectionofficer.query(sql, [centerid, userid, 1, id], (err, results) => {
            if (err) {
                return reject(err); // Reject promise if an error occurs
            }
            resolve(results); // Resolve with the query results
        });
    });
};


exports.getTargetDetailsToPassDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
                    SELECT 
                        ODT.id,
                        DT.id AS targetId,
                        CV.id AS cropId,
                        ODT.officerId,
                        CV.varietyNameEnglish, 
                        ODT.target, 
                        ODT.complete,
                        DT.toDate,
                        DT.toTime,
                        COF.empId,
                        COF.centerId,
                        COF.companyId,
                        ODT.grade,
                        (ODT.target - ODT.complete) AS todo
                    FROM officerdailytarget ODT, plant_care.cropvariety CV, dailytarget DT, collectionofficer COF
                    WHERE ODT.id = ? AND ODT.dailyTargetId = DT.id AND ODT.officerId = COF.id AND ODT.varietyId = CV.id
                `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};



exports.getOfficersToPassTargetDao = (id, company, center) => {
    console.log(id, company, center);

    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, firstNameEnglish, lastNameEnglish
            FROM collectionofficer
            WHERE companyId = ? AND centerId = ? AND id != ? AND empId NOT LIKE 'CUO%' AND empId NOT LIKE 'CCH%'
        `;
        collectionofficer.query(sql, [company, center, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getPassingOfficerDao = (data, officerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
                SELECT 
                    ODT.id,
                    DT.id AS targetId,
                    CV.id AS cropId,
                    CV.varietyNameEnglish, 
                    ODT.target, 
                    ODT.complete,
                    DT.toDate,
                    DT.toTime,
                    ODT.grade,
                    (ODT.target - ODT.complete) AS todo
                FROM officerdailytarget ODT, plant_care.cropvariety CV, dailytarget DT
                WHERE ODT.dailyTargetId = DT.id AND ODT.varietyId = CV.id AND ODT.dailyTargetId = ? AND ODT.officerId = ? AND ODT.varietyId = ? AND ODT.grade = ?

                `;
        console.log("gg---", data.targetId, officerId, data.cropId, data.grade);

        collectionofficer.query(sql, [data.targetId, officerId, data.cropId, data.grade], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.updateTargetDao = (id, amount) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE officerdailytarget
            SET target = ?
            WHERE id = ?
        `;

        collectionofficer.query(sql, [amount, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.AssignOfficerTargetDao = (targetId, verityId, offficerId, grade, target) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO officerdailytarget (dailyTargetId, varietyId, officerId, grade, target) VALUES (?, ?, ?, ?, ?)
        `

        collectionofficer.query(sql, [
            targetId,
            verityId,
            offficerId,
            grade,
            target
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};