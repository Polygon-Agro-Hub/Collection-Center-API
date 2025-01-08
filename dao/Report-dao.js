const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getAllOfficersDAO = (centerId, page, limit, searchText) => {
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
                        Coff.empId
                     FROM collectionofficer Coff, company Com 
                     WHERE Coff.companyId = Com.id AND Coff.empId NOT LIKE 'CUO%' AND Coff.centerId = ? 
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


exports.getCollectionFarmerLisDao = (officerId, page, limit, searchText, date) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT RFP.id, U.firstName, U.lastName, U.NICnumber, SUM(FPC.gradeAprice)+SUM(FPC.gradeBprice)+SUM(FPC.gradeCprice) AS totalAmount
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, \`plant-care\`.users U
            WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND RFP.collectionOfficerId = ?
        `;

        let dataSql = `
            SELECT RFP.id, U.firstName, U.lastName, U.NICnumber, SUM(FPC.gradeAprice)+SUM(FPC.gradeBprice)+SUM(FPC.gradeCprice) AS totalAmount
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, \`plant-care\`.users U
            WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND RFP.collectionOfficerId = ?
            
        `;
        console.log(officerId);

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
                    OR U.firstName LIKE ?
                    OR U.firstName LIKE ?
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
        FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, \`plant-care\`.cropvariety CV
        WHERE FPC.registerFarmerId = RFP.id AND FPC.cropId = CV.id AND RFP.collectionOfficerId = ? AND DATE(FPC.createdAt) = ?
        GROUP BY CV.varietyNameEnglish
        `;

        console.log(date.toISOString().slice(0, 10));

        collectionofficer.query(sql, [id, date.toISOString().slice(0, 10)], (err, results) => {
            if (err) {
                console.log(err);

                return reject(err);
            }
            console.log(results);
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
                console.log(err);
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
                console.log(err);
                return reject(err);
            }
            console.log(results);
            resolve(results);
        });
    });
};


exports.getFarmerDetailsDao = (id) => {
    return new Promise((resolve, reject) => {
        let sql = `
        SELECT RFP.id, U.firstName, U.lastName, U.phoneNumber, U.NICnumber, U.houseNo, U.streetName, U.city, U.district, UB.accNumber, UB.accHolderName, UB.bankName, UB.branchName, RFP.createdAt
        FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, \`plant-care\`.users U, \`plant-care\`.userbankdetails UB
        WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND U.id = UB.userId AND RFP.id = ?
        `;


        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                console.log(err);
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
        FROM registeredfarmerpayments RFP, farmerpaymentscrops FPC, \`plant-care\`.cropvariety CV, \`plant-care\`.cropgroup CG
        WHERE FPC.registerFarmerId = RFP.id AND FPC.cropId = CV.id AND CV.cropGroupId = CG.id AND RFP.id = ?
        `;


        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(results);
        });
    });
};
