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
                MPR.createdAt,
                MPR.assignRole
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

exports.forwrdRequestDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE marketpricerequest 
            SET assignRole = 'CCH'
            WHERE id = ?
        `
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllCropGroupDao = (companyId, centerId) => {
    return new Promise((resolve, reject) => {

        let dataSql = `
        SELECT DISTINCT  CG.id, CG.cropNameEnglish
        FROM collection_officer.marketprice MP, collection_officer.marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
        WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM collection_officer.companycenter WHERE companyId = ? AND centerId = ?)
        `;

        const dataParams = [companyId, centerId];

        dataSql += " ORDER BY CG.cropNameEnglish"

            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                resolve({ items: dataResults });
            });
    });
};


exports.getSelectedCropVarietyDao = (cropGroupId) => {
    return new Promise((resolve, reject) => {

        let dataSql = `
        SELECT CV.id, CV.varietyNameEnglish
            FROM plant_care.cropvariety CV
            WHERE CV.cropGroupId = ?
        `;

        const dataParams = [cropGroupId];

        dataSql += " ORDER BY CV.varietyNameEnglish"

            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                resolve({ items: dataResults });
            });
    });
};


exports.getCurrentPriceDao = (cropGroupId, cropVarietyId, grade) => {
    return new Promise((resolve, reject) => {

        let dataSql = `
        SELECT MP.id, MP.price
            FROM collection_officer.marketprice MP, collection_officer.marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM collection_officer.companycenter WHERE companyId = 1 AND centerId = 59)
            AND CV.id = ? AND CG.id = ? AND MP.grade = ?
        `;

        const dataParams = [cropVarietyId, cropGroupId, grade];

            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }
                console.log('dataResults', dataResults)
                resolve({ items: dataResults });
            });
    });
};


exports.addRequestDao = (id, centerId, userId, requstPrice) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO marketpricerequest (marketPriceId, centerId, requestPrice, empId, status, assignRole )
        VALUES (?, ?, ?, ?, 'Pending', 'CCH');
        `
        collectionofficer.query(sql, [id, centerId, requstPrice, userId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getCompanyCenterId = (id) => {
    return new Promise((resolve, reject) => {

        let dataSql = `
        
            SELECT COC.id
            FROM collection_officer.companycenter COC
            WHERE COC.centerId IN (
                SELECT centerId
                FROM collection_officer.collectionofficer
                WHERE id = ?
            )
            AND COC.companyId IN (
                SELECT companyId
                FROM collection_officer.collectionofficer
                WHERE id = ?
            )

        `;

        const dataParams = [id, id];


            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }
                console.log('dataResults', dataResults)
                resolve(dataResults[0].id);
            });
    });
};

exports.getAllPriceRequestCCHDao = (page, limit, grade, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(DISTINCT MPR.id) AS total
            FROM marketpricerequest MPR
            JOIN marketprice MP ON MPR.marketPriceId = MP.id
            JOIN collectionofficer COF ON MPR.empId = COF.id
            JOIN collectioncenter CC ON MPR.centerId = CC.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE 1 = 1       
        `;

        let dataSql = `
            SELECT DISTINCT 
                MPR.id, 
                MPR.requestPrice, 
                MPR.status, 
                COF.empId, 
                COF.id AS officerId,
                MP.grade, 
                CV.varietyNameEnglish, 
                CG.cropNameEnglish, 
                CG.id AS cropGroupId,  -- Added for better grouping
                CV.id AS varietyId,    -- Added for better ordering
                MPR.createdAt,
                MPR.assignRole,
                CC.centerName,
                CC.regCode
            FROM marketpricerequest MPR
            JOIN marketprice MP ON MPR.marketPriceId = MP.id
            JOIN collectionofficer COF ON MPR.empId = COF.id
            JOIN collectioncenter CC ON MPR.centerId = CC.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE 1 = 1 
        `;

        const countParams = [];
        const dataParams = [];

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

exports.getSelectedPriceRequestCCHDao = (requestId) => {
    return new Promise((resolve, reject) => {
        
        let dataSql = `
            SELECT DISTINCT 
                MPR.id, 
                MPR.requestPrice, 
                MPR.status, 
                COF.empId, 
                MP.grade, 
                CV.varietyNameEnglish, 
                CG.cropNameEnglish, 
                MPR.createdAt,
                CC.id AS centerId
            FROM marketpricerequest MPR
            JOIN marketprice MP ON MPR.marketPriceId = MP.id
            JOIN collectionofficer COF ON MPR.empId = COF.id
            JOIN collectioncenter CC ON MPR.centerId = CC.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE MPR.id = ?
        `;

        const dataParams = [requestId];

       // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }
                resolve({ items: dataResults });
            });
    });
};

exports.getAllPriceListCCHDao = (companyCenterId, page, limit, grade, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = ?
        `;

        let dataSql = `
            SELECT MPS.id, CG.cropNameEnglish, CV.varietyNameEnglish,  MP.averagePrice, MP.grade, MPS.updatedPrice, MP.price AS indicatePrice, MP.createdAt
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = ?
        `;

        const countParams = [companyCenterId];
        const dataParams = [companyCenterId];

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


exports.getCompanyCenterDao = (centerId, companyId) => {
    return new Promise((resolve, reject) => {

        let dataSql = `
        
        SELECT COC.id FROM collection_officer.companycenter COC
        WHERE COC.centerId = ? AND COC.companyId = ?

        `;

        const dataParams = [centerId, companyId];


            // Execute data query
            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }
                console.log('dataResults', dataResults)
                resolve(dataResults[0].id);
            });
    });
};

exports.changeStatusDao = (requestId) => {
    return new Promise((resolve, reject) => {
        const updateSql = `
            UPDATE collection_officer.marketpricerequest
            SET status = 'Approved'
            WHERE id = ?
        `;

        collectionofficer.query(updateSql, [requestId], (err, updateResult) => {
            if (err) {
                return reject(err);
            }

            if (updateResult.affectedRows === 0) {
                return resolve({ message: 'No record found to update' });
            }

            // ✅ Now fetch the related marketPriceId
            const fetchSql = `
                SELECT marketPriceId
                FROM collection_officer.marketpricerequest
                WHERE id = ?
            `;

            collectionofficer.query(fetchSql, [requestId], (err, rows) => {
                if (err) {
                    return reject(err);
                }

                if (rows.length > 0) {
                    resolve(
                        rows[0].marketPriceId
                    );
                } else {
                    resolve({
                        message: 'Status updated but no record found after update'
                    });
                }
            });
        });
    });
};



exports.updateMarketPriceCCHDao = (marketPriceId, companyCenterId, requestPrice) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE collection_officer.marketpriceserve 
            SET updatedPrice = ?, updateAt = NOW()
            WHERE marketPriceId = ? AND companyCenterId = ?
        `
        collectionofficer.query(sql, [requestPrice, marketPriceId, companyCenterId, ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.rejectStatusDao = (requestId) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE collection_officer.marketpricerequest
        SET status = 'Rejected'
        WHERE id = ?
        `
        collectionofficer.query(sql, [requestId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};