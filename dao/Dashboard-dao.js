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

exports.getChartDetails = (centerId,filter) => {
    return new Promise((resolve, reject) => {
        // const sql = `
        // SELECT 
        //     FPC.gradeAquan,
        //     FPC.gradeBquan,
        //     FPC.gradeCquan
        //     FROM collectionofficer CO, registeredfarmerpayments RFP, farmerpaymentscrop FPC
        //     WHERE FPC.registerFarmerId = RFP.id AND RFP.collectionOfficerId = CO.id AND createdAt LIKE '2024-12-31%' AND CO.id IN (
        //         SELECT 
        //             id
        //         FROM 
        //             collectionofficer
        //         WHERE 
        //             centerId = ?
        //     )

        // `;

        let sql = `
            SELECT RFP.createdAt AS date, SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS totCount
            FROM registeredfarmerpayments RFP
            JOIN farmerpaymentscrops FPC ON FPC.registerFarmerId = RFP.id
            JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
            WHERE COF.centerId = ?  
        `;

        if (filter === '7Days') {
            sql += `
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)  -- Last 7 days
                GROUP BY DATE(RFP.createdAt)
                ORDER BY DATE(RFP.createdAt)
            `;
        }

        if (filter === '30Days') {
            sql += `
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)  -- Last 30 days
                GROUP BY DATE(RFP.createdAt)
                ORDER BY DATE(RFP.createdAt)
            `;
        }

        if (filter === '12Months') {
            sql += `
                AND RFP.createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)  -- Last 12 months
                GROUP BY YEAR(RFP.createdAt), MONTH(RFP.createdAt)
                ORDER BY YEAR(RFP.createdAt) DESC, MONTH(RFP.createdAt)
            `;
        }

        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err); // Reject the promise if an error occurs
            }

            resolve(results);
        });

    });
}