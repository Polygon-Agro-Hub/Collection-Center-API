const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getCollectionOfficerCountDetails = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS COOCount
            FROM collectionofficer
            WHERE centerId = ? AND jobRole = 'Collection Officer'
            GROUP BY jobRole 
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); 
            }

            let count;
            if (results.length === 0) {
                count = { "COOCount": 0 }
            } else {
                count = results[0]
            }

            resolve(count); 
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

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err); 
            }
            let count;
            if (results.length === 0) {
                count = { "CUOCount": 0 }
            } else {
                count = results[0]
            }

            resolve(count); 
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

        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err); 
            }
            resolve(results);
        });
    });
};

exports.getChartDetails = (centerId, filter) => {
    return new Promise((resolve, reject) => {
        let sql;
        if (filter === 'week') {
            sql = `
                SELECT DAYNAME(RFP.createdAt) AS date,  -- Day name (e.g., Monday)
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
                FROM registeredfarmerpayments RFP
                JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
                JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
                WHERE COF.centerId = ?
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)  -- Last 7 days
                GROUP BY DAYNAME(RFP.createdAt)
                ORDER BY RFP.createdAt
            `;
        } else if (filter === 'month') {
            sql = `
                SELECT DAY(RFP.createdAt) AS date,  -- Day number (e.g., 1, 2, 3, ...)
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
                FROM registeredfarmerpayments RFP
                JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
                JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
                WHERE COF.centerId = ?
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)  -- Last 30 days
                GROUP BY DAY(RFP.createdAt)
                ORDER BY RFP.createdAt
            `;
        } else if (filter === 'year') {
            sql = `
                SELECT MONTHNAME(RFP.createdAt) AS date, 
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
                FROM registeredfarmerpayments RFP
                JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
                JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
                WHERE COF.centerId = ?
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY MONTHNAME(RFP.createdAt)
                ORDER BY YEAR(RFP.createdAt), MONTH(RFP.createdAt)
            `;
        }

        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err); 
            }

            resolve(results);
        });

    });
}


