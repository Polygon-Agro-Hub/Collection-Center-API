const { plantcare, collectionofficer, marketPlace, dash, admin } = require('../startup/database');

exports.getAllRecivedComplainDao = (userId, page, limit, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [userId];
        const dataParams = [userId];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCM" AND COF.irmId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, CC.categoryEnglish AS complainCategory, OC.complain, OC.CCMStatus AS status, OC.createdAt, OC.reply, COF.empId
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCM" AND COF.irmId = ?
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    OC.refNo LIKE ?
                    OR COF.empId LIKE ?
                )
            `;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            dataParams.push(searchValue, searchValue);
        }

        if (status) {
            countSql += ` AND OC.CCMStatus = ? `;
            dataSql += ` AND OC.CCMStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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


exports.GetReciveReplyByIdDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT OC.id, OC.refNo, CC.categoryEnglish AS complainCategory, OC.complain, OC.createdAt, OC.reply, OC.language, COF.empId, COF.firstNameEnglish, COF.lastNameEnglish, COF.phoneCode01, COF.phoneNumber01, COF.phoneCode02, COF.phoneNumber02
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND OC.id = ?
        `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.forwordComplaintDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
           UPDATE officercomplains
           SET complainAssign = 'CCH', CCHStatus = 'Assigned', CCMStatus = 'Opened'
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

exports.replyComplainDao = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
           UPDATE officercomplains
           SET reply = ?, CCMStatus = 'Closed', COOStatus = 'Closed'
           WHERE id = ?
        `;
        collectionofficer.query(sql, [data.reply, data.id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllSendComplainDao = (userId, companyId, page, limit, status, emptype, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [];
        const dataParams = [];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCH"
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo,  CC.categoryEnglish AS complainCategory, OC.complain, OC.CCMStatus AS status, OC.createdAt, OC.reply, COF.empId, COF.id as officerId
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCH" 
        `;


        countSql += ` AND (COF.irmId = ? OR COF.id = ?) `;
        dataSql += ` AND (COF.irmId = ? OR COF.id = ?) `;
        countParams.push(userId, userId);
        dataParams.push(userId, userId);

        if (searchText) {
            const searchCondition = `
                AND (
                    OC.refNo LIKE ?
                    OR COF.empId LIKE ?
                )
            `;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            dataParams.push(searchValue, searchValue);
        }

        if (status) {
            countSql += ` AND OC.CCMStatus = ? `;
            dataSql += ` AND OC.CCMStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (emptype) {
            if (emptype === 'Own') {
                countSql += ` AND OC.officerId = ? `;
                dataSql += ` AND OC.officerId = ? `;
                countParams.push(userId);
                dataParams.push(userId);
            } else if (emptype === 'Other') {
                countSql += ` AND COF.id != ? `;
                dataSql += ` AND COF.id != ? `;
                countParams.push(userId);
                dataParams.push(userId);
            }

        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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

exports.addComplaintDao = (officerId, category, complaint) => {
    return new Promise((resolve, reject) => {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const datePart = `${year}${month}${day}`;
        const sqlGetMaxRefNo = `
            SELECT MAX(refNo) as maxRefNo FROM officercomplains 
            WHERE refNo LIKE ?;
        `;
        const refNoPrefix = `CCM${datePart}`;

        collectionofficer.query(sqlGetMaxRefNo, [`${refNoPrefix}%`], (err, results) => {
            if (err) {
                return reject(err);
            }

            let nextSequence = 1;
            if (results && results[0] && results[0].maxRefNo) {
                const lastRefNo = results[0].maxRefNo;
                const lastSequence = parseInt(lastRefNo.slice(-4));
                nextSequence = lastSequence + 1;
            }

            const refNo = `${refNoPrefix}${nextSequence.toString().padStart(4, '0')}`;
            const language = "English";
            const status = "Assigned";
            const complainAssign = "CCH";

            const sqlInsert = `
                INSERT INTO officercomplains (officerId, refNo, language, complainCategory, complain, reply, CCHStatus, CCMStatus, complainAssign)
                VALUES (?, ?, ?, ?, ?, NULL, 'Assigned', 'Opened', 'CCH');
            `;

            collectionofficer.query(sqlInsert, [officerId, refNo, language, category, complaint], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results);
            });
        });
    });
};


exports.getAllRecivedCCHComplainDao = (companyId, page, limit, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [companyId];
        const dataParams = [companyId];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCH" AND COF.companyId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, CC.categoryEnglish AS complainCategory, OC.complain, OC.CCHStatus AS status, OC.createdAt, OC.reply, COF.empId
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND complainAssign LIKE "CCH" AND COF.companyId = ?
            
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    OC.refNo LIKE ?
                    OR COF.empId LIKE ?
                )
            `;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            dataParams.push(searchValue, searchValue);
        }

        if (status) {
            countSql += ` AND OC.CCHStatus = ? `;
            dataSql += ` AND OC.CCHStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }


        dataSql += "ORDER BY OC.createdAt DESC LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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


exports.getAllSendCCHComplainDao = (userId, companyId, page, limit, status, emptype, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [companyId];
        const dataParams = [companyId];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND OC.complainAssign = "Admin" AND COF.companyId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, CC.categoryEnglish AS complainCategory, OC.complain, OC.CCHStatus AS status, OC.createdAt, OC.reply, COF.empId, COF.id as officerId
            FROM officercomplains OC, collectionofficer COF, agro_world_admin.complaincategory CC
            WHERE OC.officerId = COF.id AND OC.complainCategory = CC.id AND OC.complainAssign = "Admin" AND COF.companyId = ?
            
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    OC.refNo LIKE ?
                    OR COF.empId LIKE ?
                )
            `;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            dataParams.push(searchValue, searchValue);
        }

        if (status) {
            countSql += ` AND OC.CCHStatus = ? `;
            dataSql += ` AND OC.CCHStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (emptype) {
            if (emptype === 'Own') {
                countSql += ` AND OC.officerId = ? `;
                dataSql += ` AND OC.officerId = ? `;
                countParams.push(userId);
                dataParams.push(userId);
            } else if (emptype === 'Other') {
                countSql += ` AND OC.officerId != ?`;
                dataSql += ` AND OC.officerId != ? `;
                countParams.push(userId);
                dataParams.push(userId);
            }

        }


        dataSql += "ORDER BY OC.createdAt DESC LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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


exports.forwordComplaintToAdminDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
           UPDATE officercomplains
           SET complainAssign = 'Admin' , CCHStatus = 'Opened', AdminStatus = 'Assigned'
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



exports.addComplaintCCHDao = (officerId, category, complaint) => {
    return new Promise((resolve, reject) => {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');
        const datePart = `${year}${month}${day}`;
        const sqlGetMaxRefNo = `
            SELECT MAX(refNo) as maxRefNo FROM officercomplains 
            WHERE refNo LIKE ?;
        `;
        const refNoPrefix = `CCH${datePart}`;

        collectionofficer.query(sqlGetMaxRefNo, [`${refNoPrefix}%`], (err, results) => {
            if (err) {
                return reject(err);
            }

            let nextSequence = 1;
            if (results && results[0] && results[0].maxRefNo) {
                const lastRefNo = results[0].maxRefNo;
                const lastSequence = parseInt(lastRefNo.slice(-4));
                nextSequence = lastSequence + 1;
            }

            const refNo = `${refNoPrefix}${nextSequence.toString().padStart(4, '0')}`;
            const language = "English";
            const status = "Assigned";
            const complainAssign = "Admin";

            const sqlInsert = `
                INSERT INTO officercomplains (officerId, refNo, language, complainCategory, complain, reply, AdminStatus, CCHStatus, complainAssign)
                VALUES (?, ?, ?, ?, ?, NULL, 'Assigned', 'Opened', 'Admin');
            `;

            collectionofficer.query(sqlInsert, [officerId, refNo, language, category, complaint], (err, results) => {
                if (err) {
                    return reject(err);
                }
                console.log(results);

                resolve(results);
            });
        });
    });
};



exports.getAllCollectiOfficerCategoryDao = () => {
    return new Promise((resolve, reject) => {

        const sql = `
            SELECT CC.id, CC.categoryEnglish
            FROM agro_world_admin.systemapplications SA, agro_world_admin.complaincategory CC
            WHERE CC.appId = SA.id AND SA.appName = 'CollectionOfficer'
        `;

        admin.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.CCHReplyComplainDao = (data) => {
    return new Promise((resolve, reject) => {
        const sql = `
           UPDATE officercomplains
           SET reply = ?, CCMStatus = 'Closed', COOStatus = 'Closed', CCHStatus = 'Closed'
           WHERE id = ?
        `;
        collectionofficer.query(sql, [data.reply, data.id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.GetComplainTemplateDataDao = (id) => {
    console.log('GetComplainTemplateDataDao called with id:', id);
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                CONCAT(COF.firstNameEnglish, ' ', COF.lastNameEnglish) AS EngName,
                CONCAT(COF.firstNameSinhala, ' ', COF.lastNameSinhala) AS SinName,
                CONCAT(COF.firstNameTamil, ' ', COF.lastNameTamil) AS TamName,
                COM.companyNameEnglish,
                COM.companyNameSinhala,
                COM.companyNameTamil
            FROM 
                collectionofficer COF
            LEFT JOIN 
                company COM ON COF.companyId = COM.id  -- Assuming there's a companyId foreign key
            WHERE 
                COF.id = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Database error in GetComplainTemplateDataDao:', err);
                return reject(new Error('Failed to fetch template data'));
            }

            if (!results || results.length === 0) {
                return resolve(null);  // Explicitly return null for no results
            }

            resolve(results[0]);  // Return first row since we're querying by ID
        });
    });
};