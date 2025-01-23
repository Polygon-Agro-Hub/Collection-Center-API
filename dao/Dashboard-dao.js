const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getCollectionOfficerCountDetails = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS COOCount
            FROM collectionofficer
            WHERE centerId = ? AND jobRole = 'Collection Officer'
            GROUP BY jobRole 
        `;

        // Pass the `id` as the parameter to the query
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject the promise if an error occurs
            }
            resolve(results[0]); // Resolve with the query results
        });
    });
};

exports.getCustomerOfficerCountDetails = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS CUOCount
            FROM collectionofficer
            WHERE centerId = ? AND jobRole = 'Customer Officer'
            GROUP BY jobRole 
        `;

        // Pass the `id` as the parameter to the query
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); // Reject the promise if an error occurs
            }
            resolve(results[0]); // Resolve with the query results
        });
    });
};

exports.getActivityDetails = () => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT MRP.price, MRP.updatedPrice, MRP.updateAt, MP.grade, CV.varietyNameEnglish, CG.cropNameEnglish
        FROM marketpriceserve MRP, marketprice MP, plant_care.cropvariety CV, plant_care.cropgroup CG
        WHERE MRP.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MRP.price != MRP.updatedPrice
        `;

        // Pass the `id` as the parameter to the query
        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err); // Reject the promise if an error occurs
            }
            // const response = results.map(row => ({
            //     price: row.price,
            //     updatedPrice: row.updatedPrice,
            //     updateAt: row.updateAt,
            //     grade: row.grade,
            //     varietyName: row.varietyName,
            //     cropName: row.cropName,
            // }));

            resolve(results);
        });
    });
};