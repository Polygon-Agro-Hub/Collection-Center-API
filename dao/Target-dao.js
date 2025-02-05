const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');


exports.getAllCropNameDAO = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT cg.id AS cropId, cv.id AS varietyId, cg.cropNameEnglish, cv.varietyNameEnglish AS varietyEnglish 
            FROM cropvariety cv, cropgroup cg
            WHERE cg.id = cv.cropGroupId
        `;

        plantcare.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }

            const groupedData = {};

            results.forEach((item) => {
                const { cropNameEnglish, varietyEnglish, varietyId, cropId } = item;


                if (!groupedData[cropNameEnglish]) {
                    groupedData[cropNameEnglish] = {
                        cropId: cropId,
                        variety: [],
                    };
                }

                groupedData[cropNameEnglish].variety.push({
                    id: varietyId,
                    varietyEnglish: varietyEnglish,
                });
            });

            const formattedResult = Object.keys(groupedData).map((cropName) => ({
                cropId: groupedData[cropName].cropId,
                cropNameEnglish: cropName,
                variety: groupedData[cropName].variety,
            }));

            resolve(formattedResult);
        });
    });
};


exports.createDailyTargetDao = (target, companyId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
           INSERT INTO dailytarget (centerId, companyId, fromDate, toDate, fromTime, toTime, createdBy)
           VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        collectionofficer.query(sql, [
            target.centerId,
            companyId,
            target.fromDate,
            target.toDate,
            target.fromTime,
            target.toTime,
            userId
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results.insertId);
        });
    });
};

exports.createDailyTargetItemsDao = (data, targetId) => {
    return new Promise((resolve, reject) => {
        const sql = `
           INSERT INTO dailytargetitems (targetId, varietyId, qtyA, qtyB, qtyC)
           VALUES (?, ?, ?, ?, ?)
        `
        collectionofficer.query(sql, [
            targetId,
            data.varietyId,
            data.qtyA,
            data.qtyB,
            data.qtyC
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results.insertId);
        });
    });
};


exports.getAllDailyTargetDAO = (centerId, page, limit, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;


        let countSql = `
            SELECT COUNT(*) AS total
            FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.centerId = ?
        `


        let targetSql = `
           SELECT CG.cropNameEnglish, CV.varietyNameEnglish, DTI.qtyA, DTI.qtyB, DTI.qtyC, DTI.complteQtyA, DTI.complteQtyB, DTI.complteQtyC, DT.toDate, DT.toTime, DT.fromTime
           FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
           WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.centerId = ? 
        `
        const sqlParams = [centerId];
        const countParams = [centerId]


        if (searchText) {
            const searchCondition =
                ` AND  CV.varietyNameEnglish LIKE ? `;
            targetSql += searchCondition;
            const searchValue = `%${searchText}%`;
            sqlParams.push(searchValue);
        }

        targetSql += " LIMIT ? OFFSET ? ";
        sqlParams.push(limit, offset);


        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0].total;

            // Execute data query
            collectionofficer.query(targetSql, sqlParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                const transformedTargetData = dataResults.flatMap(item => [
                    { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyA: item.qtyA, grade: "A", complteQtyA: item.complteQtyA },
                    { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyB: item.qtyB, grade: "B", complteQtyB: item.complteQtyB },
                    { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyC: item.qtyC, grade: "C", complteQtyC: item.complteQtyC }
                ]);

                resolve({ resultTarget: transformedTargetData, total });
            });
        });
    });
};




exports.downloadAllDailyTargetDao = (companyId, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        let targetSql = `
           SELECT CG.cropNameEnglish, CV.varietyNameEnglish, DTI.qtyA, DTI.qtyB, DTI.qtyC, DTI.complteQtyA, DTI.complteQtyB, DTI.complteQtyC, DT.toDate, DT.toTime, DT.fromTime
           FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
           WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.companyId = ? AND DATE(DT.fromDate) >= ? AND DATE(DT.toDate) <= ?
        `
        const sqlParams = [companyId, fromDate, toDate]


        collectionofficer.query(targetSql, sqlParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            const transformedTargetData = results.flatMap(item => [
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyA: item.qtyA, grade: "A", complteQtyA: item.complteQtyA },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyB: item.qtyB, grade: "B", complteQtyB: item.complteQtyB },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, toTime: item.fromTime, qtyC: item.qtyC, grade: "C", complteQtyC: item.complteQtyC }
            ]);

            // console.log(transformedTargetData);

            resolve(transformedTargetData);
        });
    });
};


exports.downloadAllDailyTargetCompleteDAO = (companyId, fromDate, toDate) => {
    return new Promise((resolve, reject) => {
        let completeSql = `
            SELECT CG.cropNameEnglish, CV.varietyNameEnglish, SUM(FPC.gradeAquan) AS totA, SUM(FPC.gradeBquan) AS totB, SUM(FPC.gradeCquan) AS totC, FPC.createdAt
            FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, collectionofficer CO, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE RFP.id = FPC.registerFarmerId AND RFP.collectionOfficerId = CO.id AND FPC.cropId = CV.id AND CV.cropGroupId = CG.id AND CO.companyId = ? AND DATE(RFP.createdAt) BETWEEN DATE(?) AND DATE(?)
            GROUP BY CG.cropNameEnglish, CV.varietyNameEnglish

        `

        const sqlParams = [companyId, fromDate, toDate]

        collectionofficer.query(completeSql, sqlParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            // console.log(results);

            const transformedCompleteData = results.flatMap(item => [
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totA: item.totA, grade: "A", buyDate: item.createdAt },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totB: item.totB, grade: "B", buyDate: item.createdAt },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totC: item.totC, grade: "C", buyDate: item.createdAt }
            ]);
            // console.log(transformedCompleteData);

            resolve(transformedCompleteData);
        });
    });
};

exports.getCenterDetailsDao = (companyId, province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        let countSql = `
        SELECT COUNT(DISTINCT CC.id) AS totalCount
        FROM companycenter COMC
        JOIN collectioncenter CC ON COMC.centerId = CC.id
        JOIN collectionofficer COF ON COF.centerId = CC.id
        WHERE COMC.companyId = ?
    `;

        // Base SQL query
        let dataSql = `
            SELECT 
                CC.id AS centerId,
                CC.centerName, 
                CC.province,
                CC.district,
                CC.city,
                CC.contact01,
                CC.regCode,
                COF.jobRole, 
                COUNT(COF.id) AS totCount
            FROM 
                companycenter COMC
            JOIN 
                collectioncenter CC ON COMC.centerId = CC.id
            JOIN 
                collectionofficer COF ON COF.centerId = CC.id
            WHERE 
                COMC.companyId = ? `;

        // Add conditions for province if provided
        const queryParams = [companyId];
        const countParams = [companyId];

        if (province) {
            dataSql += ` AND CC.province = ? `;
            countSql += ` AND CC.province = ? `;
            queryParams.push(province);
            countParams.push(province);
        }

        if (district) {
            dataSql += ` AND CC.district = ? `;
            countSql += ` AND CC.district = ? `;
            queryParams.push(district);
            countParams.push(district);
        }

        if (searchText) {
            dataSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?) `;
            countSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?) `;
            queryParams.push(`%${searchText}%`, `%${searchText}%`);
            countParams.push(`%${searchText}%`, `%${searchText}%`);
        }

        // Group and order the results
        dataSql += `
            GROUP BY 
                CC.id, CC.centerName, CC.province, CC.district, CC.city, CC.contact01, CC.regCode, COF.jobRole
        `;

        // Add pagination
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ? `;
        queryParams.push(limit, offset);

        // console.log("Final SQL Query:", dataSql, "Query Params:", queryParams);

        // Execute the query
        collectionofficer.query(dataSql, queryParams, (dataErr, dataResults) => {
            if (dataErr) {
                console.error('Error in data query:', dataErr);
                return reject(dataErr);
            }

            const jobRoles = ["Collection Officer", "Customer Officer", "Collection Center Manager", "Customer Service"];
            const centerMap = new Map();

            dataResults.forEach(({ centerId, centerName, province, district, city, contact01, regCode, jobRole, totCount }) => {
                if (!centerMap.has(centerId)) {
                    const centerData = {
                        id: centerId,
                        centerName,
                        province,
                        district,
                        city,
                        contact01,
                        regCode
                    };
                    jobRoles.forEach(role => {
                        centerData[role.replace(/\s+/g, '')] = 0;
                    });
                    centerMap.set(centerId, centerData);
                }
                const center = centerMap.get(centerId);
                if (jobRole) {
                    center[jobRole.replace(/\s+/g, '')] = totCount;
                }
            });

            const transformedResults = Array.from(centerMap.values());
            collectionofficer.query(countSql, countParams, (countErr, countResults) => {
                if (countErr) {
                    console.error('Error in count query:', countErr);
                    return reject(countErr);
                }

                const totalItems = countResults[0].totalCount;
                resolve({ totalItems, items: transformedResults });
            });
        });
    });
};

exports.getOfficerDetailsDAO = (centerId, page, limit, role, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total 
            FROM collectionofficer Coff  
            WHERE Coff.empId NOT LIKE 'CCH%' AND Coff.centerId = ? 
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.image,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.phoneCode01,
                        Coff.phoneCode02,
                        Coff.empId,
                        Coff.jobRole,
                        Coff.phoneNumber01,
                        Coff.phoneNumber02,
                        Coff.nic,
                        Coff.district,
                        Coff.status
                     FROM collectionofficer Coff
                     WHERE Coff.empId NOT LIKE 'CCH%' AND Coff.centerId = ? 

                 `;

        const countParams = [centerId];
        const dataParams = [centerId];

        if (role) {
            countSql += " AND Coff.jobRole LIKE ?";
            dataSql += " AND Coff.jobRole LIKE ?";
            countParams.push(role);
            dataParams.push(role);
        }

        if (status) {
            countSql += " AND Coff.status LIKE ?";
            dataSql += " AND Coff.status LIKE ?";
            countParams.push(status);
            dataParams.push(status);
        }

        if (searchText) {
            const searchCondition = `
                AND (
                    Coff.nic LIKE ?
                    OR Coff.firstNameEnglish LIKE ?
                    OR Coff.lastNameEnglish LIKE ?
                    OR Coff.empId LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue, searchValue, searchValue);
            dataParams.push(searchValue, searchValue, searchValue, searchValue);
        }

        dataSql += " ORDER BY Coff.createdAt DESC ";

        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(Number(limit), Number(offset));

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



exports.getCenterNameAndOficerCountDao = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
           SELECT CC.id, CC.centerName, COUNT(COF.id) AS officerCount
           FROM collectioncenter CC, collectionofficer COF
           WHERE CC.id = ? AND CC.id = COF.centerId
           GROUP BY CC.id, CC.centerName
        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};


exports.getTransactionCountDao = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(RFP.id) AS transactionCount
            FROM registeredfarmerpayments RFP, collectionofficer COF
            WHERE DATE(RFP.createdAt) = '2024-12-31' AND RFP.collectionOfficerId = COF.id AND COF.centerId = ?
            GROUP BY DATE(RFP.createdAt);

        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};

exports.getTransactionAmountCountDao = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT SUM(gradeAprice)+SUM(gradeBprice)+SUM(gradeCprice) AS transAmountCount
            FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, collectionofficer COF
            WHERE DATE(RFP.createdAt) = '2024-12-31' AND RFP.collectionOfficerId = COF.id AND RFP.id = FPC.registerFarmerId AND COF.centerId = ?
            GROUP BY DATE(RFP.createdAt);

        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};


exports.getReseantCollectionDao = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CG.cropNameEnglish, CV.varietyNameEnglish, 
                   SUM(FPC.gradeAprice) AS totAprice, SUM(FPC.gradeBprice) AS totBprice, SUM(FPC.gradeCprice) AS totCprice, 
                   SUM(FPC.gradeAquan) AS totAqty, SUM(FPC.gradeBquan) AS totBqty, SUM(FPC.gradeCquan) AS totCqty, 
                   DATE(RFP.createdAt) AS date 
            FROM registeredfarmerpayments RFP
            JOIN farmerpaymentscrops FPC ON RFP.id = FPC.registerFarmerId
            JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
            JOIN plant_care.cropvariety CV ON FPC.cropId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE DATE(RFP.createdAt) = '2024-12-31' 
            AND COF.centerId = ?
            GROUP BY CG.cropNameEnglish, CV.varietyNameEnglish, DATE(RFP.createdAt)
            ORDER BY DATE(RFP.createdAt)
            LIMIT 5
        `;

        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }

            // Corrected transformation of data
            const transformData = results.flatMap(item => {
                const entries = [];

                if (item.totAqty !== undefined) {
                    entries.push({
                        cropNameEnglish: item.cropNameEnglish,
                        varietyNameEnglish: item.varietyNameEnglish,
                        totPrice: item.totAprice,
                        totQty: item.totAqty,
                        grade: "A",
                        date: item.date
                    });
                }

                if (item.totBqty !== undefined) {
                    entries.push({
                        cropNameEnglish: item.cropNameEnglish,
                        varietyNameEnglish: item.varietyNameEnglish,
                        totPrice: item.totBprice,
                        totQty: item.totBqty,
                        grade: "B",
                        date: item.date
                    });
                }

                if (item.totCqty !== undefined) {
                    entries.push({
                        cropNameEnglish: item.cropNameEnglish,
                        varietyNameEnglish: item.varietyNameEnglish,
                        totPrice: item.totCprice,
                        totQty: item.totCqty,
                        grade: "C",
                        date: item.date
                    });
                }

                return entries;
            });

            resolve(transformData);
        });
    });
};


exports.getTotExpencesDao = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT 
            SUM(FPC.gradeAprice) + SUM(FPC.gradeBprice) + SUM(FPC.gradeCprice) AS totExpences
        FROM registeredfarmerpayments RFP
        JOIN farmerpaymentscrops FPC ON RFP.id = FPC.registerFarmerId
        JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
        WHERE RFP.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
        AND COF.centerId = ?
        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};

exports.differenceBetweenExpences = (centerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT 
            YEAR(RFP.createdAt) AS year,
            MONTH(RFP.createdAt) AS month,
            SUM(FPC.gradeAprice) + SUM(FPC.gradeBprice) + SUM(FPC.gradeCprice) AS monthexpences
        FROM registeredfarmerpayments RFP
        JOIN farmerpaymentscrops FPC ON RFP.id = FPC.registerFarmerId
        JOIN collectionofficer COF ON RFP.collectionOfficerId = COF.id
        WHERE COF.centerId = ?
        GROUP BY YEAR(RFP.createdAt), MONTH(RFP.createdAt)
        ORDER BY YEAR(RFP.createdAt) DESC, MONTH(RFP.createdAt) DESC
        LIMIT 2;
        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length < 2) {
                return reject(new Error("Not enough data to compare two months."));
            }

            const difExpences = ((results[0].monthexpences - results[1].monthexpences) / results[0].monthexpences) * 100;
            const roundedDifExpences = parseFloat(difExpences.toFixed(2));

            resolve(roundedDifExpences);
        });

    });
};

exports.getAllPriceDetailsDao = (centerId, page, limit, grade, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM marketprice MP, marketpriceserve MPS, collectioncenter CC, plant_care.cropvariety CV, plant_care.cropgroup CG 
            WHERE MPS.marketPriceId = MP.id AND MPS.collectionCenterId = CC.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.collectionCenterId = ? AND DATE(MP.createdAt) = '2024-12-31'
        `;

        let dataSql = `
            SELECT MPS.id, CG.cropNameEnglish, CV.varietyNameEnglish, MP.averagePrice, MP.grade, MPS.updatedPrice, CC.centerName, MP.createdAt AS formattedDate  
            FROM marketprice MP, marketpriceserve MPS, collectioncenter CC, plant_care.cropvariety CV, plant_care.cropgroup CG 
            WHERE MPS.marketPriceId = MP.id AND MPS.collectionCenterId = CC.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.collectionCenterId = ? AND DATE(MP.createdAt) = '2024-12-31'
        `;

        const countParams = [centerId];
        const dataParams = [centerId];

        if (grade) {
            countSql += " AND MP.grade LIKE ?";
            dataSql += " AND MP.grade LIKE ?";
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

        dataSql += " ORDER BY CG.cropNameEnglish, MP.grade "

        dataSql += " LIMIT ? OFFSET ? ";
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

exports.getAssignCenterTargetDAO = (centerId, page, limit) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;


        let countSql = `
            SELECT COUNT(*) AS total
            FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.centerId = ?
        `


        let targetSql = `
           SELECT DTI.id, CG.cropNameEnglish, CV.varietyNameEnglish, DTI.qtyA, DTI.qtyB, DTI.qtyC, DT.toDate, DT.toTime, DT.fromTime
           FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
           WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.centerId = ? 
        `
        const sqlParams = [centerId];
        const countParams = [centerId]

        targetSql += " LIMIT ? OFFSET ? ";
        sqlParams.push(limit, offset);


        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0].total;

            collectionofficer.query(targetSql, sqlParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Error in data query:', dataErr);
                    return reject(dataErr);
                }

                resolve({ resultTarget: dataResults, total });
            });
        });
    });
};



exports.getTargetVerityDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT DT.id, CV.id AS varietyId, CG.cropNameEnglish, CV.varietyNameEnglish, DTI.qtyA, DTI.qtyB, DTI.qtyC, DT.toDate, DT.toTime
        FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
        WHERE DTI.id = ? AND DTI.targetId = DT.id AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id
        `
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};


exports.getAssingTargetForOfficersDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT id, empId, jobRole, firstNameEnglish, lastNameEnglish
        FROM collectionofficer 
        WHERE irmId = ? OR id = ?
        `
        collectionofficer.query(sql, [id, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.AssignOfficerTargetDao = (targetId, verityId, offficerId, grade, target) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO officerdailytarget (dailyTargetId, varietyId, officerId, grade, target) VALUES (?, ?, ?, ?, ?)
        `

        collectionofficer.query(sql, [
            targetId,
            verityId,
            offficerId,
            grade,
            target
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getTargetDetailsToPassDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
                    SELECT 
                        ODT.id,
                        DT.id AS targetId,
                        CV.id AS cropId,
                        CV.varietyNameEnglish, 
                        ODT.target, 
                        ODT.complete,
                        DT.toDate,
                        DT.toTime,
                        COF.empId,
                        ODT.grade,
                        (ODT.target - ODT.complete) AS todo
                    FROM officerdailytarget ODT, plant_care.cropvariety CV, dailytarget DT, collectionofficer COF
                    WHERE ODT.id = ? AND ODT.dailyTargetId = DT.id AND ODT.officerId = COF.id AND ODT.varietyId = CV.id
                `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0]);
        });
    });
};



exports.getOfficersToPassTargetDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, firstNameEnglish, lastNameEnglish
            FROM collectionofficer
            WHERE irmId = ? AND empId NOT LIKE 'CUO%' AND empId NOT LIKE 'CCM%' AND empId NOT LIKE 'CCH%'
        `;
        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getPassingOfficerDao = (data, officerId) => {
    return new Promise((resolve, reject) => {
        const sql = `
                SELECT 
                    ODT.id,
                    DT.id AS targetId,
                    CV.id AS cropId,
                    CV.varietyNameEnglish, 
                    ODT.target, 
                    ODT.complete,
                    DT.toDate,
                    DT.toTime,
                    ODT.grade,
                    (ODT.target - ODT.complete) AS todo
                FROM officerdailytarget ODT, plant_care.cropvariety CV, dailytarget DT
                WHERE ODT.dailyTargetId = DT.id AND ODT.varietyId = CV.id AND ODT.dailyTargetId = ? AND ODT.officerId = ? AND ODT.varietyId = ? AND ODT.grade = ?

                `;
        console.log("gg---",data.targetId, officerId, data.cropId, data.grade);

        collectionofficer.query(sql, [data.targetId, officerId, data.cropId, data.grade], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};