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
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, plant_care.users U
            WHERE FPC.registerFarmerId = RFP.id AND RFP.userId = U.id AND RFP.collectionOfficerId = ?
        `;

        let dataSql = `
            SELECT RFP.id, U.firstName, U.lastName, U.NICnumber, SUM(FPC.gradeAprice)+SUM(FPC.gradeBprice)+SUM(FPC.gradeCprice) AS totalAmount
            FROM farmerpaymentscrops FPC, registeredfarmerpayments RFP, plant_care.users U
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

