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
        SELECT 
            MRP.price, 
            MRP.updatedPrice, 
            CASE 
                WHEN DATE(MRP.updateAt) = CURDATE() 
                    THEN DATE_FORMAT(MRP.updateAt, 'At %l:%i %p')
                ELSE DATE_FORMAT(MRP.updateAt, '%Y-%m-%d At %l:%i %p')
            END AS updateAt,
            MP.grade, 
            CV.varietyNameEnglish, 
            CG.cropNameEnglish
        FROM 
            collection_officer.marketpriceserve MRP
        JOIN 
            collection_officer.marketprice MP ON MRP.marketPriceId = MP.id
        JOIN 
            plant_care.cropvariety CV ON MP.varietyId = CV.id
        JOIN 
            plant_care.cropgroup CG ON CV.cropGroupId = CG.id
        WHERE 
            MRP.price != MRP.updatedPrice
        ORDER BY 
            MRP.updateAt DESC
        LIMIT 5


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
                SELECT DAYNAME(RFP.createdAt) AS date,
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
         FROM registeredfarmerpayments RFP
         JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
         JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
         WHERE COF.centerId = ?
         AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
         GROUP BY DAYNAME(RFP.createdAt), DAYOFWEEK(RFP.createdAt)
         ORDER BY DAYOFWEEK(RFP.createdAt)
            `;
        } else if (filter === 'month') {
            sql = `
                SELECT DAY(RFP.createdAt) AS date, 
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
                FROM registeredfarmerpayments RFP
                JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
                JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
                WHERE COF.centerId = ?
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
                GROUP BY DAY(RFP.createdAt)
                ORDER BY DAY(RFP.createdAt)
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
                GROUP BY MONTHNAME(RFP.createdAt), YEAR(RFP.createdAt), MONTH(RFP.createdAt)
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


