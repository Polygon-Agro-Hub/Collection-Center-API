const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllOfficersDAO = (centerId, companyId, userId, role, page, limit, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff, company Com 
            WHERE Coff.companyId = Com.id AND Coff.empId NOT LIKE 'CUO%' AND Coff.centerId = ? 
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.empId,
                        CEN.centerName
                     FROM collectionofficer Coff, company Com, collectioncenter CEN
                     WHERE Coff.companyId = Com.id AND Coff.centerId = CEN.id AND Coff.empId NOT LIKE 'CUO%' AND Coff.empId NOT LIKE 'CCH%' AND companyId = ? 
                 `;

        const countParams = [companyId]
        const dataParams = [companyId]

        if (role === 'CCM') {
            countSql += ` AND Coff.centerId = ? AND (Coff.irmId = ? OR Coff.id = ?)`
            dataSql += ` AND Coff.centerId = ? AND (Coff.irmId = ? OR Coff.id = ?)`
            countParams.push(centerId, userId, userId);
            dataParams.push(centerId, userId, userId);
        }




        // Apply search filters for NIC or related fields
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

        dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'CCM%' THEN 0 ELSE 1 END, Coff.createdAt DESC ";

        // Add pagination to the data query
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
            // console.log(dataSql, dataParams);

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


exports.getCollectionFarmerLisDao = (officerId, page, limit, searchText, date) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT RFP.id, U.firstName, U.lastName, U.NICnumber, SUM(FPC.gradeAprice)+SUM(FPC.gradeBprice)+SUM(FPC.gradeCprice) AS totalAmount
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, plant_care.users U
            WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND RFP.collectionOfficerId = ?
        `;

        let dataSql = `
            SELECT RFP.id, U.firstName, U.lastName, U.NICnumber, SUM(FPC.gradeAprice)+SUM(FPC.gradeBprice)+SUM(FPC.gradeCprice) AS totalAmount
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, plant_care.users U
            WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND RFP.collectionOfficerId = ?
            
        `;


        const countParams = [officerId];
        const dataParams = [officerId];

        if (date) {
            dataSql += " AND DATE(FPC.createdAt) = ?";
            dataParams.push(date.toISOString().slice(0, 10));
        }


        if (searchText) {
            const searchCondition = `
                AND (
                    U.firstName LIKE ?
                    OR U.lastName LIKE ?
                    OR U.NICnumber LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue, searchValue);
            dataParams.push(searchValue, searchValue, searchValue);
        }

        dataSql += " GROUP BY RFP.id, U.firstName, U.lastName, U.NICnumber ";
        countSql += " GROUP BY RFP.id, U.firstName, U.lastName, U.NICnumber ";

        dataSql += " ORDER BY U.firstName ASC ";


        // Add pagination to the data query
        dataSql += " LIMIT ? OFFSET ?";
        dataParams.push(limit, offset);

        // Execute count query
        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error in count query:', countErr);
                return reject(countErr);
            }

            const total = countResults[0]?.total || 0;

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



exports.getAllSalesOfficerDAO = (centerId, page, limit, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff, company Com 
            WHERE Coff.companyId = Com.id AND Coff.empId LIKE 'CUO%' AND Coff.centerId = ? 
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.empId
                     FROM collectionofficer Coff, company Com 
                     WHERE Coff.companyId = Com.id AND Coff.empId LIKE 'CUO%' AND Coff.centerId = ? 
                 `;

        const countParams = [centerId];
        const dataParams = [centerId];


        // Apply search filters for NIC or related fields
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



exports.dailyReportDao = (id, date) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT CV.id, CV.varietyNameEnglish, SUM(FPC.gradeAquan) AS gradeA, SUM(FPC.gradeBquan) AS gradeB, SUM(FPC.gradeCquan) AS gradeC, SUM(FPC.gradeAquan)+SUM(FPC.gradeBquan)+SUM(FPC.gradeCquan) AS total
        FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, plant_care.cropvariety CV
        WHERE FPC.registerFarmerId = RFP.id AND FPC.cropId = CV.id AND RFP.collectionOfficerId = ? AND DATE(FPC.createdAt) = ?
        GROUP BY CV.varietyNameEnglish
        `;



        collectionofficer.query(sql, [id, date.toISOString().slice(0, 10)], (err, results) => {
            if (err) {


                return reject(err);
            }

            resolve(results);
        });
    });
};


exports.getMonthlyReportOfficerDao = (id, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CO.id, CO.firstNameEnglish, CO.lastNameEnglish, CO.jobRole, CO.empId, SUM(FPC.gradeAquan)+SUM(FPC.gradeBquan)+SUM(FPC.gradeCquan) AS TotalQty, COUNT(RFP.userId) AS TotalFarmers
            FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, collectionofficer CO
            WHERE RFP.collectionOfficerId = CO.id AND RFP.id = FPC.registerFarmerId AND RFP.collectionOfficerId = ? AND DATE(RFP.createdAt) BETWEEN DATE(?) AND DATE(?)
            GROUP BY CO.id, CO.firstNameEnglish, CO.lastNameEnglish, CO.jobRole, CO.empId
        `;


        collectionofficer.query(sql, [id, startDate, endDate], (err, results) => {
            if (err) {

                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getMonthlyReportDao = (id, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                DATE(RFP.createdAt) AS ReportDate, 
                SUM(FPC.gradeAquan) + SUM(FPC.gradeBquan) + SUM(FPC.gradeCquan) AS TotalQty, 
                COUNT(DISTINCT RFP.userId) AS TotalFarmers
            FROM 
                registeredfarmerpayments RFP
            JOIN 
                farmerpaymentscrops FPC 
            ON 
                RFP.id = FPC.registerFarmerId
            WHERE 
                RFP.collectionOfficerId = ? AND
                DATE(RFP.createdAt) BETWEEN DATE(?) AND DATE(?)
            GROUP BY 
                ReportDate
            ORDER BY 
                ReportDate
        `;

        collectionofficer.query(sql, [id, startDate, endDate], (err, results) => {
            if (err) {

                return reject(err);
            }

            resolve(results);
        });
    });
};


exports.getFarmerDetailsDao = (id) => {
    return new Promise((resolve, reject) => {
        let sql = `
        SELECT RFP.id, U.firstName, U.lastName, U.phoneNumber, U.NICnumber, U.houseNo, U.streetName, U.city, U.district, UB.accNumber, UB.accHolderName, UB.bankName, UB.branchName, RFP.createdAt, CO.QRcode AS officerQr, U.farmerQr, RFP.invNo 
        FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, plant_care.users U, collectionofficer CO, plant_care.userbankdetails UB 
        WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND U.id = UB.userId AND RFP.collectionOfficerId = CO.id AND RFP.id = ? 
        LIMIT 1 
        `;


        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {

                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getFarmerCropsDetailsDao = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT RFP.id, CG.cropNameEnglish, CV.varietyNameEnglish, FPC.gradeAprice, FPC.gradeBprice, FPC.gradeCprice, FPC.gradeAquan, FPC.gradeBquan, FPC.gradeCquan
        FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, plant_care.cropvariety CV, plant_care.cropgroup CG
        WHERE FPC.registerFarmerId = RFP.id AND FPC.cropId = CV.id AND CV.cropGroupId = CG.id AND RFP.id = ?
        `;


        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {

                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getAllPaymentsDAO = (companyId, page, limit, searchText, center, date, month) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collection_officer.registeredfarmerpayments rfp
            LEFT JOIN collection_officer.farmerpaymentscrops fpc ON rfp.id = fpc.registerFarmerId
            LEFT JOIN collection_officer.collectionofficer co ON co.id = rfp.collectionOfficerId
            LEFT JOIN collection_officer.collectioncenter cc ON cc.id = co.centerId
            LEFT JOIN plant_care.users u ON u.id = rfp.userId
            WHERE co.companyId = ?
        `;

        let dataSql = `
        SELECT 
                rfp.createdAt, 
                rfp.invNo, 
                cc.RegCode AS centerCode, 
                cc.centerName, 
                co.firstNameEnglish,
                u.NICnumber AS nic, 
                co.companyId,
                fpc.gradeAprice, 
                fpc.gradeAquan,
                fpc.gradeBprice, 
                fpc.gradeBquan,
                fpc.gradeCprice, 
                fpc.gradeCquan,
                (IFNULL(fpc.gradeAprice, 0) * IFNULL(fpc.gradeAquan, 0) +
                IFNULL(fpc.gradeBprice, 0) * IFNULL(fpc.gradeBquan, 0) +
                IFNULL(fpc.gradeCprice, 0) * IFNULL(fpc.gradeCquan, 0)
                ) AS totalAmount
            FROM collection_officer.registeredfarmerpayments rfp
            LEFT JOIN collection_officer.farmerpaymentscrops fpc ON rfp.id = fpc.registerFarmerId
            LEFT JOIN collection_officer.collectionofficer co ON co.id = rfp.collectionOfficerId
            LEFT JOIN collection_officer.collectioncenter cc ON cc.id = co.centerId
            LEFT JOIN plant_care.users u ON u.id = rfp.userId
            WHERE co.companyId = ?
    

                 `;

        const countParams = [companyId];
        const dataParams = [companyId];

        
        if (searchText) {
            const searchCondition = `
                AND (
                    rfp.invNo LIKE ?
                    OR rfp.createdAt LIKE ?
                    OR cc.centerName LIKE ?
                    OR cc.regCode LIKE ?
                    OR u.NICnumber LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue, searchValue, searchValue, searchValue, searchValue);
            dataParams.push(searchValue, searchValue, searchValue, searchValue, searchValue);
        }

        if (center) {
            countSql += " AND cc.id = ? ";
            dataSql += " AND cc.id = ? ";
            countParams.push(center);
            dataParams.push(center);
        }

        if (date) {
            countSql += " AND DATE(rfp.createdAt) = ?";
            dataSql += " AND DATE(rfp.createdAt) = ?";
            countParams.push(date);
            dataParams.push(date);
        }

        if (month) {
            // Filter by month (YYYY-MM format)
            countSql += " AND DATE_FORMAT(rfp.createdAt, '%Y-%m') = ?";
            dataSql += " AND DATE_FORMAT(rfp.createdAt, '%Y-%m') = ?";
            countParams.push(month);
            dataParams.push(month);
        }

        // dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'CCM%' THEN 0 ELSE 1 END";


        // Add pagination to the data query
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
                console.log(dataResults);

                resolve({ items: dataResults, total });

            });
        });
    });
};

exports.downloadPaymentReport = (centerId, monthNumber, createdDate, search) => {
    return new Promise((resolve, reject) => {


        const params = [];
        const countParams = [];
        const totalParams = [];


        let whereClause = "WHERE c.id = 1";

        if (centerId) {
            whereClause += " AND co.centerId = ?";
            params.push(centerId);
            countParams.push(centerId);
            totalParams.push(centerId);
        }

        if (monthNumber) {
            whereClause += " AND MONTH(rfp.createdAt) = ?";
            params.push(monthNumber);
            countParams.push(monthNumber);
            totalParams.push(monthNumber);
        }

        if (createdDate) {
            whereClause += " AND DATE(rfp.createdAt) = ?";
            params.push(createdDate);
            countParams.push(createdDate);
            totalParams.push(createdDate);
        }

        if (search) {
            whereClause += `
          AND (
            cc.regCode LIKE ? OR 
            cc.centerName LIKE ? OR 
            us.NICnumber LIKE ? OR 
            invNo LIKE ?
          )
        `;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
            totalParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        console.log('this is', countParams);


        let dataSql = `
        SELECT 
          invNo AS grnNumber,
          cc.regCode AS regCode,
          cc.centerName AS centerName,
          ROUND(SUM(IFNULL(fpc.gradeAprice * fpc.gradeAquan, 0) + IFNULL(fpc.gradeBprice * fpc.gradeBquan, 0) + IFNULL(fpc.gradeCprice * fpc.gradeCquan, 0)), 2) AS amount,
          us.firstName AS firstName,
          us.lastName AS lastName,
          us.NICnumber AS nic,
          us.phoneNumber AS phoneNumber,
          us.phoneNumber AS phoneNumber,
          ub.accHolderName AS accHolderName,
          ub.accNumber AS accNumber,
          ub.bankName AS bankName,
          ub.branchName AS branchName,
          co.empId AS empId,
          TIME(rfp.createdAt) AS createdAt
        FROM 
          registeredfarmerpayments rfp
        LEFT JOIN 
          farmerpaymentscrops fpc ON rfp.id = fpc.registerFarmerId
        JOIN 
          collectionofficer co ON rfp.collectionOfficerId = co.id
        JOIN 
          plant_care.users us ON rfp.userId = us.id
        JOIN 
          collectioncenter cc ON co.centerId = cc.id
        JOIN 
          company c ON co.companyId = c.id
        LEFT JOIN 
          plant_care.userbankdetails ub ON us.id = ub.userId
        ${whereClause}
        GROUP BY rfp.id
      `;

        console.log('Executing Count Query...');

        collectionofficer.query(dataSql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getAllCollectionDAO = (companyId, page, limit, searchText, center, date, month) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        // Base query for both count and data
        const baseQuery = `
            FROM collection_officer.registeredfarmerpayments rfp
            LEFT JOIN collection_officer.farmerpaymentscrops fpc ON rfp.id = fpc.registerFarmerId
            LEFT JOIN collection_officer.collectionofficer co ON co.id = rfp.collectionOfficerId
            LEFT JOIN collection_officer.collectioncenter cc ON cc.id = co.centerId
            LEFT JOIN plant_care.users u ON u.id = rfp.userId
            LEFT JOIN plant_care.cropvariety cv ON fpc.cropId = cv.id
            LEFT JOIN plant_care.cropgroup cg ON cv.cropGroupId = cg.id
            WHERE co.companyId = ?
        `;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM (
                SELECT 
                    cc.RegCode,
                    cc.centerName,
                    cg.cropNameEnglish,
                    cv.varietyNameEnglish
                ${baseQuery}
        `;

        let dataSql = `
            SELECT 
                cc.RegCode AS centerCode,
                cc.centerName,
                cg.cropNameEnglish,
                cv.varietyNameEnglish,
                COUNT(rfp.id) AS transactionCount,
                SUM(IFNULL(fpc.gradeAquan, 0)) AS totalGradeAQuantity,
                SUM(IFNULL(fpc.gradeBquan, 0)) AS totalGradeBQuantity,
                SUM(IFNULL(fpc.gradeCquan, 0)) AS totalGradeCQuantity,
                SUM(IFNULL(fpc.gradeAprice, 0) * IFNULL(fpc.gradeAquan, 0)) AS totalGradeAAmount,
                SUM(IFNULL(fpc.gradeBprice, 0) * IFNULL(fpc.gradeBquan, 0)) AS totalGradeBAmount,
                SUM(IFNULL(fpc.gradeCprice, 0) * IFNULL(fpc.gradeCquan, 0)) AS totalGradeCAmount,
                SUM(
                    IFNULL(fpc.gradeAprice, 0) * IFNULL(fpc.gradeAquan, 0) +
                    IFNULL(fpc.gradeBprice, 0) * IFNULL(fpc.gradeBquan, 0) +
                    IFNULL(fpc.gradeCprice, 0) * IFNULL(fpc.gradeCquan, 0)
                ) AS totalAmount
            ${baseQuery}
        `;

        const countParams = [companyId];
        const dataParams = [companyId];

        // Add search conditions
        if (searchText) {
            const searchCondition = `
                AND (

                    cc.centerName LIKE ?
                    OR cc.RegCode LIKE ?
                    OR cg.cropNameEnglish LIKE ?
                    OR cv.varietyNameEnglish LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(
                searchValue, searchValue,
                searchValue, searchValue
            );
            dataParams.push(
                searchValue, searchValue,
                searchValue, searchValue
            );
        }

        // Add center filter
        if (center) {
            countSql += " AND co.centerId = ?";
            dataSql += " AND co.centerId = ?";
            countParams.push(center);
            dataParams.push(center);
        }

        // Add date filter
        if (date) {
            countSql += " AND DATE(rfp.createdAt) = ?";
            dataSql += " AND DATE(rfp.createdAt) = ?";
            countParams.push(date);
            dataParams.push(date);
        }

        // Add month filter
        if (month) {
            countSql += " AND DATE_FORMAT(rfp.createdAt, '%Y-%m') = ?";
            dataSql += " AND DATE_FORMAT(rfp.createdAt, '%Y-%m') = ?";
            countParams.push(month);
            dataParams.push(month);
        }

        // Add GROUP BY clause to both queries
        const groupByClause = `
            GROUP BY 
                cc.RegCode,
                cc.centerName,
                cg.cropNameEnglish,
                cv.varietyNameEnglish
        `;

        countSql += groupByClause + ") AS grouped_data"; // Close the subquery for count
        dataSql += groupByClause;

        // Add ORDER BY and pagination to data query
        dataSql += `
            ORDER BY 
                rfp.createdAt
            LIMIT ? OFFSET ?
        `;
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

                resolve({ 
                    items: dataResults, 
                    total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit)
                });
            });
        });
    });
};

exports.downloadCollectionReport = (centerId, monthNumber, createdDate, search) => {
    return new Promise((resolve, reject) => {


        const params = [];
        const countParams = [];
        const totalParams = [];


        let whereClause = "WHERE 1 = 1";

        if (centerId) {
            whereClause += " AND co.centerId = ?";
            params.push(centerId);
            countParams.push(centerId);
            totalParams.push(centerId);
        }

        if (monthNumber) {
            whereClause += " AND MONTH(rfp.createdAt) = ?";
            params.push(monthNumber);
            countParams.push(monthNumber);
            totalParams.push(monthNumber);
        }

        if (createdDate) {
            whereClause += " AND DATE(rfp.createdAt) = ?";
            params.push(createdDate);
            countParams.push(createdDate);
            totalParams.push(createdDate);
        }

        if (search) {
            whereClause += `
          AND (
            cc.regCode LIKE ? OR 
            cc.centerName LIKE ? OR 
            us.NICnumber LIKE ? OR 
            invNo LIKE ?
          )
        `;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
            totalParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        console.log('this is', countParams);


        let dataSql = `
        SELECT 
          cc.regCode AS regCode,
          cc.centerName AS centerName,
          fpc.gradeAquan,
          fpc.gradeBquan,
          fpc.gradeCquan,
          cv.varietyNameEnglish,
          cg.cropNameEnglish,
          ROUND(SUM(IFNULL(fpc.gradeAquan, 0) + IFNULL(fpc.gradeBquan, 0) + IFNULL(fpc.gradeCquan, 0)), 2) AS totalQuan
        FROM 
          registeredfarmerpayments rfp
        LEFT JOIN 
          farmerpaymentscrops fpc ON rfp.id = fpc.registerFarmerId
        JOIN 
          collectionofficer co ON rfp.collectionOfficerId = co.id
        JOIN 
          plant_care.users us ON rfp.userId = us.id
        JOIN 
          collectioncenter cc ON co.centerId = cc.id
        JOIN 
          company c ON co.companyId = c.id
        LEFT JOIN plant_care.cropvariety cv ON fpc.cropId = cv.id
        LEFT JOIN plant_care.cropgroup cg ON cv.cropGroupId = cg.id
        ${whereClause}
        GROUP BY 
        cc.RegCode,
        cc.centerName,
        cg.cropNameEnglish,
        cv.varietyNameEnglish
      `;

        console.log('Executing Count Query...');

        collectionofficer.query(dataSql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};