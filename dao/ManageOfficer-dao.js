const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const uploadFileToS3 = require('../middlewares/s3upload');
const deleteFromS3 = require('../middlewares/s3delete');
const path = require("path");

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


exports.createCollectionOfficerPersonal = (officerData, centerId, companyId, managerID, image, lastId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }



            // Generate QR Code
            const qrData = JSON.stringify({ empId: lastId });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${lastId}.png`, "collectionofficer/QRcode");


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
                    return reject(err);
                }
                resolve(results);
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
                    return reject(err);
                }
                resolve(results);
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
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'CCM%' OR Coff.empId LIKE 'COO%') AND Coff.centerId = ?
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
                     WHERE (Coff.empId LIKE 'CCM%' OR Coff.empId LIKE 'COO%') AND Coff.centerId = ?

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



exports.getAllCompanyNamesDao = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, companyNameEnglish
            FROM company
            WHERE isCollection = 1
        `;
        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
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
                return reject(err);
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
                return reject(err);
            }
            if (results.length > 0) {
                resolve({
                    email: results[0].email,
                    firstNameEnglish: results[0].firstNameEnglish,
                    empId: results[0].empId,
                    Existstatus: results[0].status
                });
            } else {
                resolve(null);
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

                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.SendGeneratedPasswordDao = async (email, password, empId, firstNameEnglish) => {
    try {
        const doc = new PDFDocument();

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Add watermark (if needed)
        const watermarkPath = path.resolve(__dirname, "../assets/bg.png");
        doc.opacity(0.2)
            .image(watermarkPath, 100, 300, { width: 400 })
            .opacity(1);

        // Add content to PDF
        doc.fontSize(20)
            .fillColor('#071a51')
            .text('Welcome to AgroWorld (Pvt) Ltd - Registration Confirmation', { align: 'center' })
            .moveDown();

        doc.moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke()
            .moveDown();

        doc.fontSize(12)
            .text(`Dear ${firstNameEnglish},`)
            .moveDown()
            .text('Thank you for registering with us! We are excited to have you on board.')
            .moveDown()
            .text('You have successfully created an account with AgroWorld (Pvt) Ltd. Our platform will help you with all your agricultural needs, providing guidance, weather reports, asset management tools, and much more. We are committed to helping farmers like you grow and succeed.', { align: 'justify' })
            .moveDown()
            .text(`Your User Name/ID: ${empId}`)
            .text(`Your Password: ${password}`)
            .moveDown()
            .text('If you have any questions or need assistance, feel free to reach out to our support team at info@agroworld.lk', { align: 'justify' })
            .moveDown()
            .text('We are here to support you every step of the way!', { align: 'justify' })
            .moveDown()
            .text('Best Regards,')
            .text('The AgroWorld Team')
            .text('AgroWorld (Pvt) Ltd. | All rights reserved.')
            .moveDown()
            .text('Address: No:14,')
            .text('            Sir Baron Jayathilake Mawatha,')
            .text('            Colombo 01.')
            .moveDown()
            .text('Email: info@agroworld.lk');

        // Finalize the PDF
        doc.end();

        // Wait for PDF to finish generating
        const pdfBuffer = await new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Send email with PDF attachment (without saving to disk)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: { family: 4 },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to AgroWorld (Pvt) Ltd - Registration Confirmation',
            text: `Dear ${firstNameEnglish},\n\nYour registration details are attached in the PDF.`,
            attachments: [{
                filename: `registration_${empId}.pdf`,
                content: pdfBuffer, // Attach PDF from memory (no file saved)
            }],
        };

        await transporter.sendMail(mailOptions);
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
                CEN.centerName,
                CEN.regCode,
                DC.centerName AS distributedCenterName,
                DC.id AS distributedCenterId,
                DC.regCode AS distributedCenterRegCode,
                VR.*,
                VR.id AS vehicleRegId
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id
            LEFT JOIN 
                collectioncenter CEN ON COF.centerId = CEN.id
            LEFT JOIN 
                distributedcenter DC ON COF.distributedCenterId = DC.id
            LEFT JOIN
                vehicleregistration VR ON COF.id = VR.coId
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
            const empIdWithoutPrefix = officer.empId ? officer.empId.substring(3) : null;
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
                    jobRole: officer.jobRole,
                    employeeType: officer.empType,
                    accHolderName: officer.accHolderName,
                    accNumber: officer.accNumber,
                    bankName: officer.bankName,
                    branchName: officer.branchName,
                    companyNameEnglish: officer.companyNameEnglish,
                    centerName: officer.centerName,
                    centerId: officer.centerId,
                    companyId: officer.companyId,
                    irmId: officer.irmId,
                    regCode: officer.regCode,
                    claimStatus: officer.claimStatus,
                    distributedCenterId: officer.distributedCenterId,
                    distributedCenterName: officer.distributedCenterName,
                    distributedCenterRegCode: officer.distributedCenterRegCode,
                    licNo: officer.licNo,
                    insNo: officer.insNo,
                    insExpDate: officer.insExpDate,
                    vType: officer.vType,
                    vCapacity: officer.vCapacity,
                    vRegNo: officer.vRegNo,
                    licFrontImg: officer.licFrontImg,
                    licBackImg: officer.licBackImg,
                    insFrontImg: officer.insFrontImg,
                    insBackImg: officer.insBackImg,
                    vehFrontImg: officer.vehFrontImg,
                    vehBackImg: officer.vehBackImg,
                    vehSideImgA: officer.vehSideImgA,
                    vehSideImgB: officer.vehSideImgB
                },
                driver: {
                    vehicleRegId: officer.vehicleRegId,
                    licNo: officer.licNo,
                    insNo: officer.insNo,
                    insExpDate: officer.insExpDate,
                    vType: officer.vType,
                    vCapacity: officer.vCapacity,
                    vRegNo: officer.vRegNo,
                    licFrontImg: officer.licFrontImg,
                    licBackImg: officer.licBackImg,
                    insFrontImg: officer.insFrontImg,
                    insBackImg: officer.insBackImg,
                    vehFrontImg: officer.vehFrontImg,
                    vehBackImg: officer.vehBackImg,
                    vehSideImgA: officer.vehSideImgA,
                    vehSideImgB: officer.vehSideImgB
                }
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


            // Generate QR Code
            await deleteFromS3(officerData.previousQR);

            const qrData = JSON.stringify({ empId: officerData.empIdPrefix });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empIdPrefix}.png`, "collectionofficer/QRcode");



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
                officerData.empIdPrefix,
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

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
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
                CEN.centerName,
                DC.centerName AS distributedCenterName
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id
            LEFT JOIN 
                collectioncenter CEN ON COF.centerId = CEN.id
            LEFT JOIN 
                distributedcenter DC ON COF.distributedCenterId = DC.id
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
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getTargetDetailsToPassDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT 
            OFT.id,
            DT.id AS targetId,
            CV.id AS cropId,
            OFT.officerId,
            CV.varietyNameEnglish, 
            OFT.target, 
            OFT.complete,

            COF.empId,
            COF.centerId,
            COF.companyId,
            DT.grade,
            (OFT.target - OFT.complete) AS todo
        FROM collection_officer.officertarget OFT, plant_care.cropvariety CV, collection_officer.dailytarget DT, collection_officer.collectionofficer COF
        WHERE OFT.id = ? AND OFT.dailyTargetId = DT.id AND OFT.officerId = COF.id AND DT.varietyId = CV.id
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



exports.getAllOfficersForCCHDAO = (companyId, page, limit, status, role, searchText, center) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'CCM%' OR Coff.empId LIKE 'COO%')
            AND Coff.companyId = ?
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
                     FROM collectionofficer Coff, collectioncenter Cen 
                     WHERE Coff.centerId = Cen.id
                     AND (Coff.empId LIKE 'CCM%' OR Coff.empId LIKE 'COO%')
                     AND Coff.companyId = ?

                 `;

        const countParams = [companyId];
        const dataParams = [companyId];

        // Apply filters for company ID
        if (center) {
            countSql += " AND Coff.centerId = ? ";
            dataSql += " AND Coff.centerId = ? ";
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


exports.getCCHOwnCenters = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CC.id, CC.centerName, CC.regCode
            FROM collectioncenter CC, companycenter COMC
            WHERE COMC.centerId = CC.id AND COMC.companyId = ?
            ORDER BY 
    CC.centerName ASC;
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getCCHOwnCentersWithRegCode = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CC.id, CC.centerName, CC.regCode
            FROM collectioncenter CC, companycenter COMC
            WHERE COMC.centerId = CC.id AND COMC.companyId = ?
            ORDER BY CC.regCode ASC, CC.centerName ASC;
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getCenterManagerDao = (companyId, centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, firstNameEnglish, lastNameEnglish
            FROM collectionofficer
            WHERE companyId = ? AND centerId = ? AND empId LIKE 'CCM%'
        `;

        collectionofficer.query(sql, [companyId, centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.createCollectionOfficerPersonalCCH = (officerData, companyId, image, lastId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }

            if (officerData.jobRole === 'Collection Center Manager' || officerData.jobRole === 'Driver') {
                officerData.irmId = null;
            }



            // Generate QR Code
            const qrData = JSON.stringify({ empId: lastId });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${lastId}.png`, "collectionofficer/QRcode");


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
                    officerData.centerId,
                    companyId,
                    officerData.irmId,
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


exports.CCHupdateOfficerDetails = (id, officerData, image) => {
    return new Promise(async (resolve, reject) => {

        if (officerData.jobRole === 'officerData.jobRole') {
            officerData.irmId = null;
        }

        try {
            // Debugging: Check if officerData exists
            if (!officerData || !officerData.firstNameEnglish) {
                return reject(new Error("Officer data is missing or incomplete"));
            }


            // Generate QR Code
            await deleteFromS3(officerData.previousQR);

            const qrData = JSON.stringify({ empId: officerData.empIdPrefix });
            const qrCodeBase64 = await QRCode.toDataURL(qrData);
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ""), "base64");
            const qrcodeURL = await uploadFileToS3(qrCodeBuffer, `${officerData.empIdPrefix}.png`, "collectionofficer/QRcode");



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
                    QRcode = ?,
                    centerId = ?,
                    irmId = ?
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
                officerData.centerId,
                officerData.irmId,
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

exports.vehicleRegisterDao = (id, driverData, licFrontImg, licBackImg, insFrontImg, insBackImg, vehFrontImg, vehBackImg, vehSideImgA, vehSideImgB) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO vehicleregistration (coId, licNo, insNo, insExpDate, vType, vCapacity, vRegNo, licFrontImg, licBackImg, insFrontImg, insBackImg, vehFrontImg, vehBackImg, vehSideImgA, vehSideImgB)
            VaLUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        collectionofficer.query(sql, [
            id,
            driverData.licNo,
            driverData.insNo,
            driverData.insExpDate,
            driverData.vType,
            driverData.vCapacity,
            driverData.vRegNo,
            licFrontImg,
            licBackImg,
            insFrontImg,
            insBackImg,
            vehFrontImg,
            vehBackImg,
            vehSideImgA,
            vehSideImgB
        ], (err, results) => {
            if (err) {
                return reject(err);
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

exports.updateVehicleRegistratinDao = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE vehicleregistration
            SET
                licNo = ?, 
                insNo = ?, 
                insExpDate = ?, 
                vType = ?, 
                vCapacity = ?, 
                vRegNo = ?, 
                licFrontImg = ?, 
                licBackImg = ?, 
                insFrontImg = ?, 
                insBackImg = ?, 
                vehFrontImg = ?, 
                vehBackImg = ?, 
                vehSideImgA = ?, 
                vehSideImgB = ?
            WHERE 
                id = ?
        `;

        collectionofficer.query(sql, [
            data.licNo,
            data.insNo,
            data.insExpDate,
            data.vType,
            data.vCapacity,
            data.vRegNo,
            data.licFrontImg,
            data.licBackImg,
            data.insFrontImg,
            data.insBackImg,
            data.vehFrontImg,
            data.vehBackImg,
            data.vehSideImgA,
            data.vehSideImgB,
            data.vehicleRegId
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.checkExistingNic = (nic) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM collectionofficer WHERE nic = ?";
        collectionofficer.query(sql, [nic], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
};


exports.getExistingNic = (nic, id) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
            SELECT id 
            FROM collection_officer.collectionofficer co 
            WHERE co.nic = ? AND co.id != ?
        `;
        const dataParams = [nic, id];

        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                // A different record with the same NIC exists
                return resolve(results[0].id);
            }

            // No duplicate NIC found (or only found the current user's NIC)
            resolve(null);
        });
    });
};


exports.getExistingEmail = (email, id) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
            SELECT id 
            FROM collection_officer.collectionofficer co 
            WHERE co.email = ? AND co.id != ?
        `;
        const dataParams = [email, id];

        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                // A different record with the same NIC exists
                return resolve(results[0].id);
            }

            // No duplicate NIC found (or only found the current user's NIC)
            resolve(null);
        });
    });
};

exports.getExistingPhone1 = (phone1, id) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
        SELECT id 
        FROM collection_officer.collectionofficer co 
        WHERE (co.phoneNumber01 = ? OR co.phoneNumber02 = ?) 
          AND co.id != ?
        `;
        const dataParams = [phone1, phone1, id];

        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                // A different record with the same NIC exists
                return resolve(results[0].id);
            }

            // No duplicate NIC found (or only found the current user's NIC)
            resolve(null);
        });
    });
};


exports.getExistingPhone2 = (phone2, id) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
        SELECT id 
        FROM collection_officer.collectionofficer co 
        WHERE (co.phoneNumber01 = ? OR co.phoneNumber02 = ?) 
          AND co.id != ?
        `;
        const dataParams = [phone2, phone2, id];

        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length > 0) {
                // A different record with the same NIC exists
                return resolve(results[0].id);
            }

            // No duplicate NIC found (or only found the current user's NIC)
            resolve(null);
        });
    });
};


exports.ProfileImageBase64ByIdDAO = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COF.image
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id
            LEFT JOIN 
                collectioncenter CEN ON COF.centerId = CEN.id
            LEFT JOIN
                vehicleregistration VR ON COF.id = VR.coId
            WHERE 
                COF.id = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }

            resolve({
                results
            });
        });
    });
};

exports.getDCHOwnCenters = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT DC.id, DC.centerName, DC.regCode
            FROM distributedcenter DC, distributedcompanycenter DCC
            WHERE DCC.centerId = DC.id AND DCC.companyId = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
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
