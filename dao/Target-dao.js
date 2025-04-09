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


exports.getAllDailyTargetDAO = (companyCenterId, searchText) => {
    return new Promise((resolve, reject) => {

        // const offset = (page - 1) * limit;


        // let countSql = `
        //     SELECT COUNT(*) AS total
        //     FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
        //     WHERE DT.id = DTI.targetId AND DTI.varietyId = CV.id AND CV.cropGroupId = CG.id AND DT.centerId = ?
        // `


        let targetSql = `
            SELECT 
                DT.id, 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish, 
                DT.grade, 
                DT.target, 
                DT.complete, 
                DT.assignStatus,
                DT.date,
                CASE 
                    WHEN DT.target > DT.complete THEN 'Pending'
                    ELSE 'Completed'
                END AS status

            FROM dailytarget DT, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE DT.date = CURDATE() and DT.companyCenterId = ? AND DT.target != 0 AND DT.varietyId = CV.id AND CV.cropGroupId = CG.id
        `
        const sqlParams = [companyCenterId];
        // const countParams = [centerId]


        if (searchText) {
            const searchCondition =
                ` AND  CV.varietyNameEnglish LIKE ? `;
            targetSql += searchCondition;
            const searchValue = `%${searchText}%`;
            sqlParams.push(searchValue);
        }

        // targetSql += " LIMIT ? OFFSET ? ";
        // sqlParams.push(limit, offset);


        // collectionofficer.query(countSql, countParams, (countErr, countResults) => {
        //     if (countErr) {
        //         console.error('Error in count query:', countErr);
        //         return reject(countErr);
        //     }

        // const total = countResults[0].total;
        const total = 0;

        // Execute data query
        collectionofficer.query(targetSql, sqlParams, (dataErr, dataResults) => {
            console.log(dataResults);
            if (dataErr) {
                console.error('Error in data query:', dataErr);
                return reject(dataErr);
            }


            resolve({ resultTarget: dataResults, total });
        });
    });
    // });
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


            const transformedCompleteData = results.flatMap(item => [
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totA: item.totA, grade: "A", buyDate: item.createdAt },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totB: item.totB, grade: "B", buyDate: item.createdAt },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, totC: item.totC, grade: "C", buyDate: item.createdAt }
            ]);


            resolve(transformedCompleteData);
        });
    });
};

// exports.getCenterDetailsDao = (companyId, province, district, searchText, page, limit) => {
//     return new Promise((resolve, reject) => {
//         let countSql = `
//         SELECT COUNT(DISTINCT CC.id) AS totalCount
//         FROM companycenter COMC
//         JOIN collectioncenter CC ON COMC.centerId = CC.id
//         JOIN collectionofficer COF ON COF.centerId = CC.id
//         WHERE COMC.companyId = ?
//     `;

//         // Base SQL query
//         let dataSql = `
//             SELECT 
//                 CC.id AS centerId,
//                 CC.centerName, 
//                 CC.province,
//                 CC.district,
//                 CC.city,
//                 CC.contact01,
//                 CC.regCode,
//                 COF.jobRole, 
//                 COUNT(COF.id) AS totCount
//             FROM 
//                 companycenter COMC
//             JOIN 
//                 collectioncenter CC ON COMC.centerId = CC.id
//             JOIN 
//                 collectionofficer COF ON COF.centerId = CC.id
//             WHERE 
//                 COMC.companyId = ? `;

//         // Add conditions for province if provided
//         const queryParams = [companyId];
//         const countParams = [companyId];

//         if (province) {
//             dataSql += ` AND CC.province = ? `;
//             countSql += ` AND CC.province = ? `;
//             queryParams.push(province);
//             countParams.push(province);
//         }

//         if (district) {
//             dataSql += ` AND CC.district = ? `;
//             countSql += ` AND CC.district = ? `;
//             queryParams.push(district);
//             countParams.push(district);
//         }

//         if (searchText) {
//             dataSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?) `;
//             countSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?) `;
//             queryParams.push(`%${searchText}%`, `%${searchText}%`);
//             countParams.push(`%${searchText}%`, `%${searchText}%`);
//         }

//         // Group and order the results
//         dataSql += `
//             GROUP BY 
//                 CC.id, CC.centerName, CC.province, CC.district, CC.city, CC.contact01, CC.regCode, COF.jobRole
//         `;

//         // Add pagination
//         const offset = (page - 1) * limit;
//         dataSql += ` LIMIT ? OFFSET ? `;
//         queryParams.push(limit, offset);



//         // Execute the query
//         collectionofficer.query(dataSql, queryParams, (dataErr, dataResults) => {
//             if (dataErr) {
//                 console.error('Error in data query:', dataErr);
//                 return reject(dataErr);
//             }
//             console.log('data results', dataResults);

//             const jobRoles = ["Collection Officer", "Customer Officer", "Collection Center Manager", "Customer Service"];
//             const centerMap = new Map();

//             dataResults.forEach(({ centerId, centerName, province, district, city, contact01, regCode, jobRole, totCount }) => {
//                 if (!centerMap.has(centerId)) {
//                     const centerData = {
//                         id: centerId,
//                         centerName,
//                         province,
//                         district,
//                         city,
//                         contact01,
//                         regCode
//                     };
//                     jobRoles.forEach(role => {
//                         centerData[role.replace(/\s+/g, '')] = 0;
//                     });
//                     console.log('this is center data', centerData);
//                     centerMap.set(centerId, centerData);
//                     console.log('this is center map', centerMap);
//                 }
//                 const center = centerMap.get(centerId);
//                 if (jobRole) {
//                     center[jobRole.replace(/\s+/g, '')] = totCount;
//                 }
//             });

//             const transformedResults = Array.from(centerMap.values());
//             console.log('this is transformed data', transformedResults);
//             collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//                 if (countErr) {
//                     console.error('Error in count query:', countErr);
//                     return reject(countErr);
//                 }

//                 const totalItems = countResults[0].totalCount;
//                 resolve({ totalItems, items: transformedResults });
//             });
//         });
//     });
// };



exports.getCenterDetailsDaoNew = (companyId, province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters
        if (!companyId) {
            return reject(new Error('Company ID is required'));
        }

        page = page || 1;
        limit = limit || 10;

        // Base count query to get total number of centers
        let countSql = `
            SELECT COUNT(DISTINCT CC.id) AS totalCount
            FROM companycenter COMC
            JOIN collectioncenter CC ON COMC.centerId = CC.id
            WHERE COMC.companyId = ?
        `;

        // Base data query to fetch center details
        let dataSql = `
            SELECT 
                CC.id AS centerId,
                CC.regCode,
                CC.centerName, 
                CC.city,
                CC.province,
                CC.district,
                CC.contact01,
                CC.contact02,
                COALESCE(SUM(CASE WHEN COF.jobRole = 'Collection Officer' THEN 1 ELSE 0 END), 0) AS collectionOfficerCount,
                COALESCE(SUM(CASE WHEN COF.jobRole = 'Customer Officer' THEN 1 ELSE 0 END), 0) AS customerOfficerCount,
                COALESCE(SUM(CASE WHEN COF.jobRole = 'Collection Center Manager' THEN 1 ELSE 0 END), 0) AS collectionCenterManagerCount,
                COALESCE(SUM(CASE WHEN COF.jobRole = 'Customer Service' THEN 1 ELSE 0 END), 0) AS customerServiceCount
            FROM 
                companycenter COMC
            JOIN 
                collectioncenter CC ON COMC.centerId = CC.id
            LEFT JOIN 
                collectionofficer COF ON COF.centerId = CC.id
            WHERE 
                COMC.companyId = ?
        `;

        // Prepare query parameters
        const queryParams = [companyId];
        const countParams = [companyId];

        // Add conditions for province if provided
        if (province) {
            dataSql += ` AND CC.province = ?`;
            countSql += ` AND CC.province = ?`;
            queryParams.push(province);
            countParams.push(province);
        }

        // Add conditions for district if provided
        if (district) {
            dataSql += ` AND CC.district = ?`;
            countSql += ` AND CC.district = ?`;
            queryParams.push(district);
            countParams.push(district);
        }

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?)`;
            countSql += ` AND (CC.centerName LIKE ? OR CC.regCode LIKE ?)`;
            queryParams.push(`%${searchText}%`, `%${searchText}%`);
            countParams.push(`%${searchText}%`, `%${searchText}%`);
        }

        // Group the results by center details
        dataSql += `
            GROUP BY 
                CC.id, CC.regCode, CC.centerName, CC.province, 
                CC.district, CC.contact01, CC.contact02
        `;

        // Add pagination
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // First, execute the data query
        collectionofficer.query(dataSql, queryParams, (dataErr, dataResults) => {
            if (dataErr) {
                console.error('Error in data query:', dataErr);
                return reject(dataErr);
            }

            // Then, execute the count query
            collectionofficer.query(countSql, countParams, (countErr, countResults) => {
                if (countErr) {
                    console.error('Error in count query:', countErr);
                    return reject(countErr);
                }

                // Prepare the response
                const totalItems = countResults[0].totalCount;
                const totalPages = Math.ceil(totalItems / limit);

                resolve({
                    totalItems,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    items: dataResults
                });
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
           SELECT CC.id, CC.centerName, CC.regCode, COUNT(COF.id) AS officerCount
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
            WHERE DATE(RFP.createdAt) = CURDATE() AND RFP.collectionOfficerId = COF.id AND COF.centerId = ?
            GROUP BY DATE(RFP.createdAt);

        `
        collectionofficer.query(sql, [centerId], (err, results) => {
            if (err) {
                console.log(err);
                return reject(err);
            }

            if (results.length === 0) {
                return resolve({ transactionCount: 0 })
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

            if (results.length === 0) {
                return resolve({ transAmountCount: 0 })
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
            if (results.length === 0) {
                return resolve({ totExpences: 0.00 })
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
                console.log(err);

                return reject(err);
            }

            // if (results.length < 2) {
            //     return reject(new Error("Not enough data to compare two months."));
            // }

            let difExpences = 0.00
            if (results.length >= 2) {
                difExpences = ((results[0].monthexpences - results[1].monthexpences) / results[0].monthexpences) * 100;
            }

            const roundedDifExpences = parseFloat(difExpences.toFixed(2));

            resolve(roundedDifExpences);
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

        dataSql += `
            GROUP BY 
                CC.id, CC.centerName, CC.province, CC.district, CC.city, CC.contact01, CC.regCode, COF.jobRole
        `;

        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ? `;
        queryParams.push(limit, offset);

        collectionofficer.query(dataSql, queryParams, (dataErr, dataResults) => {
            if (dataErr) {
                console.error('Error in data query:', dataErr);
                return reject(dataErr);
            }
            console.log(dataResults);

            const jobRoles = ["Collection Officer", "Customer Officer", "Collection Center Manager"];

            // Using a reducer to transform data efficiently
            const transformedResults = dataResults.reduce((acc, row) => {
                const { centerId, centerName, province, district, city, contact01, regCode, jobRole, totCount } = row;

                if (!acc[centerId]) {
                    acc[centerId] = {
                        id: centerId,
                        centerName,
                        province,
                        district,
                        city,
                        contact01,
                        regCode
                    };

                    // Initialize job role counts
                    jobRoles.forEach(role => {
                        acc[centerId][role.replace(/\s+/g, '')] = 0;
                    });
                }

                if (jobRole) {
                    acc[centerId][jobRole.replace(/\s+/g, '')] = totCount;
                }

                return acc;
            }, {});
            console.log(transformedResults);

            const finalResults = Object.values(transformedResults);
            console.log(finalResults);

            collectionofficer.query(countSql, countParams, (countErr, countResults) => {
                if (countErr) {
                    console.error('Error in count query:', countErr);
                    return reject(countErr);
                }

                const totalItems = countResults[0].totalCount;
                resolve({ totalItems, items: finalResults });
            });
        });
    });
};


//prev dao
exports.getTargetVerityDao = (companyCenterId, varietyId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                DT.id, 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish, 
                DT.grade, 
                DT.target, 
                DT.complete, 
                DT.assignStatus,
                DT.date,
                DT.varietyId,
                DT.companyCenterId
            FROM dailytarget DT
            JOIN plant_care.cropvariety CV ON DT.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE DT.date = CURDATE() AND DT.companyCenterId = ? AND DT.varietyId = ?

        `
        collectionofficer.query(sql, [companyCenterId, varietyId], (err, results) => {
            if (err) {
                return reject(err);
            }

            const grouped = {};

            results.forEach(row => {
                const key = `${row.cropNameEnglish}|${row.varietyNameEnglish}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        idA: null,
                        idB: null,
                        idC: null,
                        varietyId: row.varietyId,
                        companyCenterId: row.companyCenterId,
                        cropNameEnglish: row.cropNameEnglish,
                        varietyNameEnglish: row.varietyNameEnglish,
                        qtyA: 0,
                        qtyB: 0,
                        qtyC: 0,
                        assignStatusA: 0,
                        assignStatusB: 0,
                        assignStatusC: 0,
                        toDate: row.date,
                    };
                }

                if (row.grade === 'A') {
                    grouped[key].qtyA = parseFloat(row.target) || 0;
                    grouped[key].idA = row.id
                    grouped[key].assignStatusA = row.assignStatus;
                } else if (row.grade === 'B') {
                    grouped[key].qtyB = parseFloat(row.target) || 0;
                    grouped[key].idB = row.id
                    grouped[key].assignStatusB = row.assignStatus;
                } else if (row.grade === 'C') {
                    grouped[key].qtyC = parseFloat(row.target) || 0;
                    grouped[key].idC = row.id
                    grouped[key].assignStatusC = row.assignStatus;
                }
            });

            // console.log(Object.values(grouped));

            resolve(Object.values(grouped));
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


exports.AssignOfficerTargetDao = (targetId, officerId, target) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO officertarget (dailyTargetId, officerId, target, complete) VALUES (?, ?, ?, ?)
        `

        collectionofficer.query(sql, [
            targetId,
            officerId,
            target,
            0
        ], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getOfficerTargetDao = (userId, status, search) => {
    return new Promise((resolve, reject) => {
        let sql =
            `SELECT 
            ODT.id, 
            ODT.dailyTargetId, 
            ODT.varietyId, 
            CV.varietyNameEnglish, 
            CG.cropNameEnglish, 
            ODT.target, 
            ODT.grade, 
            ODT.complete, 
            DT.toDate, 
            DT.toTime, 
            CO.empId,
            CASE 
                WHEN ODT.target > ODT.complete THEN 'Pending'
                WHEN ODT.target < ODT.complete THEN 'Exceeded'
                WHEN ODT.target = ODT.complete THEN 'Completed'
            END AS status,
            CASE 
                WHEN ODT.complete > ODT.target THEN 0.00
                ELSE ODT.target - ODT.complete
            END AS remaining
        FROM dailytarget DT 
        JOIN officerdailytarget ODT ON ODT.dailyTargetId = DT.id 
        JOIN plant_care.cropvariety CV ON ODT.varietyId = CV.id 
        JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
        JOIN collectionofficer CO ON ODT.officerId = CO.id
        WHERE CO.id = ?`;

        const params = [userId];

        // Add the status condition if it is provided
        if (status) {
            sql += ` AND (
                CASE 
                    WHEN ODT.target > ODT.complete THEN 'Pending'
                    WHEN ODT.target < ODT.complete THEN 'Exceeded'
                    WHEN ODT.target = ODT.complete THEN 'Completed'
                END
            ) = ?`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (CV.varietyNameEnglish LIKE ? OR CG.cropNameEnglish LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        collectionofficer.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};





exports.getOfficerTargetDao = (userId, status, search) => {
    return new Promise((resolve, reject) => {
        let sql =
            `SELECT 
            ODT.id, 
            ODT.dailyTargetId, 
            ODT.varietyId, 
            CV.varietyNameEnglish, 
            CG.cropNameEnglish, 
            ODT.target, 
            ODT.grade, 
            ODT.complete, 
            DT.toDate, 
            DT.toTime, 
            CO.empId,
            CASE 
                WHEN ODT.target > ODT.complete THEN 'Pending'
                WHEN ODT.target < ODT.complete THEN 'Exceeded'
                WHEN ODT.target = ODT.complete THEN 'Completed'
            END AS status,
            CASE 
                WHEN ODT.complete > ODT.target THEN 0.00
                ELSE ODT.target - ODT.complete
            END AS remaining
        FROM dailytarget DT 
        JOIN officerdailytarget ODT ON ODT.dailyTargetId = DT.id 
        JOIN plant_care.cropvariety CV ON ODT.varietyId = CV.id 
        JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
        JOIN collectionofficer CO ON ODT.officerId = CO.id
        WHERE CO.id = ?`;

        const params = [userId];

        // Add the status condition if it is provided
        if (status) {
            sql += ` AND (
                CASE 
                    WHEN ODT.target > ODT.complete THEN 'Pending'
                    WHEN ODT.target < ODT.complete THEN 'Exceeded'
                    WHEN ODT.target = ODT.complete THEN 'Completed'
                END
            ) = ?`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (CV.varietyNameEnglish LIKE ? OR CG.cropNameEnglish LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        collectionofficer.query(sql, params, (err, results) => {
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


        collectionofficer.query(sql, [data.targetId, officerId, data.cropId, data.grade], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.updateTargetDao = (id, amount) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE officerdailytarget
            SET target = ?
            WHERE id = ?
        `;

        collectionofficer.query(sql, [amount, id], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getSelectedOfficerTarget = (officerId, status, search) => {
    return new Promise((resolve, reject) => {
        let sql =
            `SELECT 
            ODT.id, 
            ODT.dailyTargetId, 
            ODT.varietyId, 
            CV.varietyNameEnglish, 
            CG.cropNameEnglish, 
            ODT.target, 
            ODT.grade, 
            ODT.complete, 
            DT.toDate, 
            DT.toTime, 
            CO.empId,
            CASE 
                WHEN ODT.target > ODT.complete THEN 'Pending'
                WHEN ODT.target < ODT.complete THEN 'Exceeded'
                WHEN ODT.target = ODT.complete THEN 'Completed'
            END AS status,
            CASE 
                WHEN ODT.complete > ODT.target THEN 0.00
                ELSE ODT.target - ODT.complete
            END AS remaining
        FROM dailytarget DT 
        JOIN officerdailytarget ODT ON ODT.dailyTargetId = DT.id 
        JOIN plant_care.cropvariety CV ON ODT.varietyId = CV.id 
        JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
        JOIN collectionofficer CO ON ODT.officerId = CO.id
        WHERE CO.id = ?`;

        const params = [officerId];

        // Add the status condition if it is provided
        if (status) {
            sql += ` AND (
                CASE 
                    WHEN ODT.target > ODT.complete THEN 'Pending'
                    WHEN ODT.target < ODT.complete THEN 'Exceeded'
                    WHEN ODT.target = ODT.complete THEN 'Completed'
                END
            ) = ?`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (CV.varietyNameEnglish LIKE ? OR CG.cropNameEnglish LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        collectionofficer.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllPriceDetailsDao = (companyId, centerId, page, limit, grade, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM companycenter WHERE companyId = ? AND centerId = ?)
        `;

        let dataSql = `
            SELECT MPS.id, CG.cropNameEnglish, CV.varietyNameEnglish,  MP.averagePrice, MP.grade, MPS.updatedPrice, MP.createdAt
            FROM marketprice MP, marketpriceserve MPS, plant_care.cropvariety CV, plant_care.cropgroup CG
            WHERE MPS.marketPriceId = MP.id AND MP.varietyId = CV.id AND CV.cropGroupId = CG.id AND MPS.companyCenterId = (SELECT id FROM companycenter WHERE companyId = ? AND centerId = ?)
        `;

        const countParams = [companyId, centerId];
        const dataParams = [companyId, centerId];

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

exports.createCenter = (centerData, companyId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate input data
            if (!centerData || !centerData.centerName) {
                return reject(new Error("Center data is missing or incomplete"));
            }

            // SQL query to check for duplicate regCode
            const checkDuplicateSQL = `
                SELECT regCode FROM collectioncenter WHERE regCode = ?
            `;

            // Check for duplicate regCode
            collectionofficer.query(
                checkDuplicateSQL,
                [centerData.regCode],
                (err, duplicateResults) => {
                    if (err) {
                        console.error("Database Error (check duplicate):", err);
                        return reject(err);
                    }

                    // If a duplicate regCode exists, reject the promise with an error
                    if (duplicateResults.length > 0) {
                        return reject(new Error(`Duplicate regCode: ${centerData.regCode} already exists.`));
                    }

                    // SQL query to insert data into collectioncenter
                    const insertCenterSQL = `
                        INSERT INTO collectioncenter (
                            regCode, centerName, district, province, buildingNumber, city, street, country
                        ) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    // Execute the query to insert data into collectioncenter
                    collectionofficer.query(
                        insertCenterSQL,
                        [
                            centerData.regCode,
                            centerData.centerName,
                            centerData.district,
                            centerData.province,
                            centerData.buildingNumber,
                            centerData.city,
                            centerData.street,
                            centerData.country,
                        ],
                        (err, centerResults) => {
                            if (err) {
                                console.error("Database Error (collectioncenter):", err);
                                return reject(err);
                            }

                            // Get the inserted ID for collectioncenter
                            const centerId = centerResults.insertId;

                            // SQL query to insert data into companycenter
                            const insertCompanyCenterSQL = `
                                INSERT INTO companycenter (centerId, companyId)
                                VALUES (?, ?)
                            `;

                            // Execute the query to insert data into companycenter
                            collectionofficer.query(
                                insertCompanyCenterSQL,
                                [centerId, companyId],
                                (err, companyCenterResults) => {
                                    if (err) {
                                        console.error("Database Error (companycenter):", err);
                                        return reject(err);
                                    }

                                    // Return success response
                                    resolve({
                                        message: "Data inserted successfully",
                                        centerId: centerId,
                                        companyCenterId: companyCenterResults.insertId,
                                    });
                                }
                            );
                        }
                    );
                }
            );
        } catch (error) {
            console.error("Error:", error);
            reject(error);
        }
    });
};







exports.updateTargetAssignStatus = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE dailytarget
        SET assignStatus = 1
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


exports.getExsistVerityTargetDao = (target, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                CO.id, 
                CO.empId, 
                CO.jobRole, 
                CO.firstNameEnglish, 
                CO.lastNameEnglish, 
                DT.grade, 
                OFT.target,
                OFT.id AS officerTargetId
            FROM 
                collectionofficer CO
            LEFT JOIN 
               officertarget OFT ON CO.id = OFT.officerId AND (OFT.dailyTargetId = ? OR OFT.dailyTargetId = ? OR OFT.dailyTargetId = ?)
            LEFT JOIN
                dailytarget DT ON OFT.dailyTargetId = DT.id
            WHERE 
                CO.irmId = ? 
                OR CO.id = ?
        `
        collectionofficer.query(sql, [target.idA, target.idB, target.idC, userId, userId], (err, results) => {
            if (err) {
                return reject(err);
            }
            console.log(results);
            

            const transformedData = results.reduce((acc, item) => {
                const { id, empId, jobRole, firstNameEnglish, lastNameEnglish, grade, target, officerTargetId } = item;

                if (!acc[id]) {
                    acc[id] = {
                        id,
                        empId,
                        jobRole,
                        firstNameEnglish,
                        lastNameEnglish,
                        targetAId: null,
                        targetA: 0,
                        prevousTargetA: 0,
                        targetBId: null,
                        targetB: 0,
                        prevousTargetB: 0,
                        targetCId: null,
                        targetC: 0,
                        prevousTargetC: 0,
                    };
                }

                if (grade === "A") {
                    acc[id].targetAId = officerTargetId;
                    acc[id].targetA = parseFloat(target);
                    acc[id].prevousTargetA = parseFloat(target);
                } else if (grade === "B") {
                    acc[id].targetBId = officerTargetId;
                    acc[id].targetB = parseFloat(target);
                    acc[id].prevousTargetB = parseFloat(target);
                } else if (grade === "C") {
                    acc[id].targetCId = officerTargetId;
                    acc[id].targetC = parseFloat(target);
                    acc[id].prevousTargetC = parseFloat(target);
                }

                return acc;
            }, {});

            console.log(transformedData);
            

            const result = Object.values(transformedData);
            resolve(result);
        });
    });
};



exports.getCenterTargetDAO = (centerId, page, limit, searchText) => {
    return new Promise((resolve, reject) => {
        let targetSql = `
           SELECT CG.cropNameEnglish, CV.varietyNameEnglish, DTI.qtyA, DTI.qtyB, DTI.qtyC, 
                  DTI.complteQtyA, DTI.complteQtyB, DTI.complteQtyC, 
                  DATE_FORMAT(DT.toDate, '%d/%m/%Y') AS toDate, DT.toTime, DT.fromTime
           FROM dailytarget DT, dailytargetitems DTI, plant_care.cropvariety CV, plant_care.cropgroup CG
           WHERE DT.id = DTI.targetId 
             AND DTI.varietyId = CV.id 
             AND CV.cropGroupId = CG.id 
             AND DT.centerId = ? 
             AND (
                 (DT.toDate > CURDATE()) OR 
                 (DT.toDate = CURDATE() AND DT.toTime >= CURTIME())
             )
        `;
        const sqlParams = [centerId];
        if (searchText) {
            const searchCondition = ` AND CV.varietyNameEnglish LIKE ? `;
            targetSql += searchCondition;
            const searchValue = `%${searchText}%`;
            sqlParams.push(searchValue);
        }
        // Execute data query
        collectionofficer.query(targetSql, sqlParams, (dataErr, dataResults) => {
            if (dataErr) {
                console.error('Error in data query:', dataErr);
                return reject(dataErr);
            }
            const transformedTargetData = dataResults.flatMap(item => [
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, fromTime: item.fromTime, qtyA: item.qtyA, grade: "A", complteQtyA: item.complteQtyA },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, fromTime: item.fromTime, qtyB: item.qtyB, grade: "B", complteQtyB: item.complteQtyB },
                { cropNameEnglish: item.cropNameEnglish, varietyNameEnglish: item.varietyNameEnglish, toDate: item.toDate, toTime: item.toTime, fromTime: item.fromTime, qtyC: item.qtyC, grade: "C", complteQtyC: item.complteQtyC }
            ]);
            resolve({ resultTarget: transformedTargetData, total: dataResults.length });
        });
    });
};


//----------------------- New part ---------------------


exports.getCenterCenterCropsDao = (companyCenterId, page, limit, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const countParams = [companyCenterId];
        const dataParams = [companyCenterId, companyCenterId]; // Ensures correct parameter order

        let countSql = `
            SELECT COUNT(DISTINCT CV.id) AS total
            FROM marketprice MP
            JOIN marketpriceserve MPS ON MPS.marketPriceId = MP.id
            JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE MPS.companyCenterId = ?
        `;

        let dataSql = `
            SELECT 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish, 
                CV.id AS cropId, 
                CASE 
                    WHEN EXISTS (
                        SELECT 1
                        FROM centercrops
                        WHERE companyCenterId = ? AND varietyId = CV.id
                    ) THEN 1 
                    ELSE 0 
                END AS isAssign
            FROM 
                marketprice MP
                JOIN marketpriceserve MPS ON MPS.marketPriceId = MP.id
                JOIN plant_care.cropvariety CV ON MP.varietyId = CV.id
                JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE 
                MPS.companyCenterId = ?
            
        `;

        if (searchText) {
            dataSql += ` AND (CG.cropNameEnglish LIKE ? OR CV.varietyNameEnglish LIKE ?) `
            countSql += ` AND (CG.cropNameEnglish LIKE ? OR CV.varietyNameEnglish LIKE ?) `
            dataParams.push(`%${searchText}%`, `%${searchText}%`);
            countParams.push(`%${searchText}%`, `%${searchText}%`);
        }

        dataSql += ` 
            GROUP BY 
                    CG.cropNameEnglish, 
                    CV.varietyNameEnglish,
                    CV.id
                ORDER BY 
                    CG.cropNameEnglish ASC, 
                    CV.varietyNameEnglish ASC 
                LIMIT ? OFFSET ?
        `
        dataParams.push(limit, offset);

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


exports.getCompanyCenterIDDao = (companyId, centerId) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
            SELECT id FROM companycenter WHERE companyId = ? AND centerId = ?
        `;
        const dataParams = [companyId, centerId];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            if (results.length === 0) {
                return resolve(null);
            }
            resolve(results[0].id);
        });
    });
};


exports.addCenterCropsDao = (companyCenterId, cropId) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
            INSERT INTO centercrops (companyCenterId, varietyId)
            VALUES (?, ?)
        `;
        const dataParams = [companyCenterId, cropId];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
};

exports.removeCenterCropsDao = (companyCenterId, cropId) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
           DELETE FROM centercrops
           WHERE companyCenterId = ? AND varietyId = ?
        `;
        const dataParams = [companyCenterId, cropId];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
};


exports.getSavedCenterCropsDao = (id, date, state, searchText) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
            SELECT 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish,
                DT.grade,
                DT.target,
                DT.id,
                CC.varietyId 
            FROM 
                centercrops CC
            LEFT JOIN 
                dailytarget DT ON CC.companyCenterId = DT.companyCenterId AND CC.varietyId = DT.varietyId
            
        `;

        const dataParams = [];


        if (state) {
            const dateParam = new Date(date).toISOString().split('T')[0];
            dataSql += ` AND DT.date = ? `;
            dataParams.push(dateParam);
        } else {
            const dateParam = new Date(date).toISOString().split('T')[0];
            dataSql += `AND DT.date != ? `;
            dataParams.push(dateParam);
        }

        dataSql += `
            JOIN 
                plant_care.cropvariety CV ON CC.varietyId = CV.id
            JOIN 
                plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE 
                CC.companyCenterId = ? 
        `;
        dataParams.push(id);

        if (searchText) {
            dataSql += ` AND (CG.cropNameEnglish LIKE ? OR CV.varietyNameEnglish LIKE ?) `
            dataParams.push(`%${searchText}%`, `%${searchText}%`);
        }


        dataSql += `
            ORDER BY
                CG.cropNameEnglish ASC, CV.varietyNameEnglish ASC

        `;



        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }

            if (results.length === 0 && state) {
                this.getSavedCenterCropsDao(id, date, false, searchText)
                    .then(resolve)  // Resolve with the result from the recursive call
                    .catch(reject); // Reject with any error from the recursive call
            } else {
                const aggregatedResults = {};

                results.forEach(row => {
                    const key = `${row.cropNameEnglish}|${row.varietyNameEnglish}`;

                    if (!aggregatedResults[key]) {
                        aggregatedResults[key] = {
                            cropNameEnglish: row.cropNameEnglish,
                            varietyNameEnglish: row.varietyNameEnglish,
                            varietyId: row.varietyId,
                            targetA: 0,
                            targetB: 0,
                            targetC: 0,
                            idA: null,
                            idB: null,
                            idC: null
                        };
                    }

                    if (row.grade === 'A') {
                        aggregatedResults[key].targetA = parseFloat(row.target);
                        aggregatedResults[key].idA = row.id;
                    } else if (row.grade === 'B') {
                        aggregatedResults[key].targetB = parseFloat(row.target);
                        aggregatedResults[key].idB = row.id;
                    } else if (row.grade === 'C') {
                        aggregatedResults[key].targetC = parseFloat(row.target);
                        aggregatedResults[key].idC = row.id;
                    }
                });

                const finalResults = Object.values(aggregatedResults);

                // Check if ALL crops have ALL null IDs (completely new)
                const isNew = finalResults.every(item =>
                    item.idA === null &&
                    item.idB === null &&
                    item.idC === null
                );

                resolve({ data: finalResults, isNew });
            }
        });
    });
};

exports.updateCenterTargeQtyDao = (id, qty) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
           UPDATE dailytarget 
           SET target = ?, assignStatus = 0
           WHERE id = ?
        `;
        const dataParams = [qty, id];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.addNewCenterTargetDao = (companyCenterId, varietyId, grade, target, date) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
           INSERT INTO dailytarget (companyCenterId, varietyId, grade, target,complete, date, assignStatus)
           VALUES (?, ?, ?, ?, r?, ?, 0)
        `;

        const dateParam = new Date(date).toISOString().split('T')[0];

        const dataParams = [companyCenterId, varietyId, grade, target, 0, dateParam];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getAssignCenterTargetDAO = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                DT.id, 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish, 
                DT.grade, 
                DT.target, 
                DT.complete, 
                DT.assignStatus,
                DT.date,
                DT.varietyId,
                DT.companyCenterId,
                CASE 
                    WHEN DT.target > DT.complete THEN 'Pending'
                    ELSE 'Completed'
                END AS status,
                (SELECT 
                    CASE 
                      WHEN COUNT(*) > 0 THEN 1 
                      ELSE 0 
                    END  
                    FROM officertarget 
                    WHERE dailyTargetId = DT.id) AS isAssign
            FROM dailytarget DT
            JOIN plant_care.cropvariety CV ON DT.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE DT.date = CURDATE() AND DT.companyCenterId = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                return reject(err);
            }

            const grouped = {};

            console.log("results", results);
            

            results.forEach(row => {
                const key = `${row.cropNameEnglish}|${row.varietyNameEnglish}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        varietyId: row.varietyId,
                        companyCenterId: row.companyCenterId,
                        cropNameEnglish: row.cropNameEnglish,
                        varietyNameEnglish: row.varietyNameEnglish,
                        qtyA: 0,
                        qtyB: 0,
                        qtyC: 0,
                        assignStatusA: 0,
                        assignStatusB: 0,
                        assignStatusC: 0,
                        toDate: row.date,
                        isAssign: 0,
                    };
                }

                if (row.grade === 'A') {
                    grouped[key].qtyA = row.target
                    grouped[key].assignStatusA = row.assignStatus;
                    if(row.isAssign === 1){
                        grouped[key].isAssign = 1;
                    }
                } else if (row.grade === 'B') {
                    grouped[key].qtyB = row.target
                    grouped[key].assignStatusB = row.assignStatus;
                    if(row.isAssign === 1){
                        grouped[key].isAssign = 1;
                    }
                } else if (row.grade === 'C') {
                    grouped[key].qtyC = row.target
                    grouped[key].assignStatusC = row.assignStatus;
                    if(row.isAssign === 1){
                        grouped[key].isAssign = 1;
                    }
                }
            });

            resolve(Object.values(grouped));
        });
    });
};



exports.getAssignTargetIdsDao = (id, cropId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                DT.id, 
                CG.cropNameEnglish, 
                CV.varietyNameEnglish, 
                DT.grade
            FROM dailytarget DT
            JOIN plant_care.cropvariety CV ON DT.varietyId = CV.id
            JOIN plant_care.cropgroup CG ON CV.cropGroupId = CG.id
            WHERE DT.date = CURDATE() AND DT.companyCenterId = ? AND DT.varietyId = ?
        `;

        collectionofficer.query(sql, [id, cropId], (err, results) => {
            if (err) {
                return reject(err);
            }

            const grouped = {};

            // console.log("results", results);
            

            results.forEach(row => {
                const key = `${row.cropNameEnglish}|${row.varietyNameEnglish}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        // varietyId: row.varietyId,
                        // companyCenterId: row.companyCenterId,
                        // cropNameEnglish: row.cropNameEnglish,
                        // varietyNameEnglish: row.varietyNameEnglish,
                        idA: null,
                        idB: null,
                        idC: null,
                    };
                }

                if (row.grade === 'A') {
                    grouped[key].idA = row.id
                } else if (row.grade === 'B') {
                    grouped[key].idB = row.id
                    
                } else if (row.grade === 'C') {
                    grouped[key].idC = row.id
                }
            });

            resolve(Object.values(grouped));
        });
    });
};


