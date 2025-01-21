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


exports.getAllSendComplainDao = (userId,companyId, page, limit, status, emptype, searchText) => {
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
            }else if(emptype === 'Other'){
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
