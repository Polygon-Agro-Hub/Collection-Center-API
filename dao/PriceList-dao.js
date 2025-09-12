const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllPriceListDao = (companyId, centerId, page, limit, grade, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM companycenter WHERE companyId = ? AND centerId = ?)
        `;

        let dataSql = `
            SELECT MPS.id, CG.cropNameEnglish, CV.varietyNameEnglish,  MP.averagePrice, MP.grade, MPS.updatedPrice, MP.price AS indicatePrice, MP.createdAt
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM companycenter WHERE companyId = ? AND centerId = ?)
        `;

        const countParams = [companyId, centerId];
        const dataParams = [companyId, centerId];

        if (grade) {
            countSql += " AND MP.grade LIKE ? ";
            dataSql += " AND MP.grade LIKE ? ";
            countParams.push(grade);
            dataParams.push(grade);
        }

        if (searchText) {
            const searchCondition = `
                AND (
                    CG.cropNameEnglish LIKE ?
                    OR CV.varietyNameEnglish LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue);
            dataParams.push(searchValue, searchValue);
        }

        dataSql += " ORDER BY CG.cropNameEnglish, CV.varietyNameEnglish, MP.grade  "

        dataSql += " LIMIT ? OFFSET ?";
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


exports.updatePriceDao = (id, value) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE marketpriceserve 
            SET updatedPrice = ?, updateAt = NOW()
            WHERE id = ?
        `
        collectionofficer.query(sql, [value, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllPriceRequestDao = (centerId, page, limit, grade, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(DISTINCT MPR.id) AS total
            FROM marketpricerequest MPR
            JOIN marketprice MP ON MPR.marketPriceId = MP.id
            JOIN collectionofficer COF ON MPR.empId = COF.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE MPR.centerId = ?        
        `;

        let dataSql = `
            SELECT DISTINCT 
                MPR.id, 
                MPR.requestPrice, 
                MPR.status, 
                COF.empId, 
                MP.grade, 
                CV.varietyNameEnglish, 
                CG.cropNameEnglish, 
                CG.id AS cropGroupId,  -- Added for better grouping
                CV.id AS varietyId,    -- Added for better ordering
                MPR.createdAt
            FROM marketpricerequest MPR
            JOIN marketprice MP ON MPR.marketPriceId = MP.id
            JOIN collectionofficer COF ON MPR.empId = COF.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE MPR.centerId = ?
        `;

        const countParams = [centerId];
        const dataParams = [centerId];

        if (grade) {
            countSql += " AND MP.grade LIKE ? ";
            dataSql += " AND MP.grade LIKE ? ";
            countParams.push(grade);
            dataParams.push(grade);
        }

        if (status) {
            countSql += " AND MPR.status LIKE ? ";
            dataSql += " AND MPR.status LIKE ? ";
            countParams.push(status);
            dataParams.push(status);
        }

        if (searchText) {
            const searchCondition = `
                AND (
                    CG.cropNameEnglish LIKE ?
                    OR CV.varietyNameEnglish LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue);
            dataParams.push(searchValue, searchValue);
        }

        // Modified ORDER BY clause for proper grouping
        dataSql += ` 
            ORDER BY 
                CG.cropNameEnglish ASC,  
                
                MPR.createdAt DESC 
            LIMIT ? OFFSET ? 
        `;
        dataParams.push(limit, offset);

        // Execute count query
        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults.length > 0 ? countResults[0].total : 0;

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


exports.ChangeRequestStatusDao = (id, status) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE marketpricerequest 
            SET status = ?
            WHERE id = ?
        `
        collectionofficer.query(sql, [status, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};
