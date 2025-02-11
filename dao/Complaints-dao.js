const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllRecivedComplainDao = (userId, page, limit, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [userId];
        const dataParams = [userId];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCM" AND COF.irmId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, OC.complainCategory, OC.complain, OC.status, OC.createdAt, OC.reply, COF.empId
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCM" AND COF.irmId = ?
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
            countSql += ` AND OC.status = ? `;
            dataSql += ` AND OC.status = ? `;
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
            SELECT OC.id, OC.refNo, OC.complainCategory, OC.complain, OC.createdAt, OC.reply, OC.language, COF.empId, COF.firstNameEnglish, COF.lastNameEnglish, COF.phoneCode01, COF.phoneNumber01, COF.phoneCode02, COF.phoneNumber02
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND OC.id = ?
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
           SET complainAssign = 'CCH'
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
           SET reply = ?, status = 'Closed'
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
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCH" 
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, OC.complainCategory, OC.complain, OC.status, OC.createdAt, OC.reply, COF.empId, COF.id as officerId
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCH" 
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
            countSql += ` AND OC.status = ? `;
            dataSql += ` AND OC.status = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (emptype) {
            if (emptype === 'Own') {
                countSql += ` AND COF.irmId = ? `;
                dataSql += ` AND COF.irmId = ? `;
                countParams.push(userId);
                dataParams.push(userId);
            } else if (emptype === 'Other') {
                countSql += ` AND COF.companyId = ? `;
                dataSql += ` AND COF.companyId = ? `;
                countParams.push(companyId);
                dataParams.push(companyId);
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
        const refNoPrefix = `CC${datePart}`;

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
                INSERT INTO officercomplains (officerId, refNo, language, complainCategory, complain, reply, status, complainAssign)
                VALUES (?, ?, ?, ?, ?, NULL, ?, ?);
            `;

            collectionofficer.query(sqlInsert, [officerId, refNo, language, category, complaint, status, complainAssign], (err, results) => {
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
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCH" AND COF.companyId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, OC.complainCategory, OC.complain, OC.status, OC.createdAt, OC.reply, COF.empId
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "CCH" AND COF.companyId = ?
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
            countSql += ` AND OC.status = ? `;
            dataSql += ` AND OC.status = ? `;
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


exports.getAllSendCCHComplainDao = (userId, companyId, page, limit, status, emptype, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [companyId];
        const dataParams = [companyId];


        let countSql = `
            SELECT COUNT(*) AS total
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "Admin" AND COF.companyId = ?
        `;

        let dataSql = `
            SELECT OC.id, OC.refNo, OC.complainCategory, OC.complain, OC.status, OC.createdAt, OC.reply, COF.empId, COF.id as officerId
            FROM officercomplains OC, collectionofficer COF
            WHERE OC.officerId = COF.id AND complainAssign LIKE "Admin" AND COF.companyId = ?
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
            countSql += ` AND OC.status = ? `;
            dataSql += ` AND OC.status = ? `;
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


exports.forwordComplaintToAdminDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
           UPDATE officercomplains
           SET complainAssign = 'Admin'
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
        const refNoPrefix = `CC${datePart}`;

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
                INSERT INTO officercomplains (officerId, refNo, language, complainCategory, complain, reply, status, complainAssign)
                VALUES (?, ?, ?, ?, ?, NULL, ?, ?);
            `;

            collectionofficer.query(sqlInsert, [officerId, refNo, language, category, complaint, status, complainAssign], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results);
            });
        });
    });
};




