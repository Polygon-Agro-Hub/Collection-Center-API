const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllRecivedComplainDao = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT FC.id, FC.refNo, FC.complainCategory, FC.complain, FC.status, COF.empId
            FROM farmercomplains FC, collectionofficer COF
            WHERE FC.coId = COF.id AND FC.farmerId IS NULL
        `;
        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};
