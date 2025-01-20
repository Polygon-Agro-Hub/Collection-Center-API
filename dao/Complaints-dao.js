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
