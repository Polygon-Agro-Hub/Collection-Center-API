const { plantcare, collectionofficer, marketPlace, dash, admin } = require('../startup/database');


exports.getAllOfficersDAO = (centerId, page, limit, status, role, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.distributedCenterId = ?
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
                     WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.distributedCenterId = ?

                 `;

        const countParams = [centerId];
        const dataParams = [centerId];

        // Apply filters for company ID
        if (status) {
            countSql += " AND Coff.status LIKE ?";
            dataSql += " AND Coff.status LIKE ?";
            countParams.push(status);
            dataParams.push(status);
        }

        if (role) {
            countSql += " AND Coff.jobRole LIKE ?";
            dataSql += " AND Coff.jobRole LIKE ?";
            countParams.push(role);
            dataParams.push(role);
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

        dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'CCM%' THEN 0 ELSE 1 END";


        // Add pagination to the data query
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

exports.getAllOfficersForDCHDAO = (companyId, page, limit, status, role, searchText, center) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ?
        `;

        let dataSql = `
                     SELECT
                        Coff.id,
                        Coff.image,
                        Coff.firstNameEnglish,
                        Coff.lastNameEnglish,
                        Coff.phoneCode01,
                        Coff.phoneCode02,
                        Cen.centerName,
                        Coff.empId,
                        Coff.jobRole,
                        Coff.phoneNumber01,
                        Coff.phoneNumber02,
                        Coff.nic,
                        Coff.district,
                        Coff.status
                     FROM collectionofficer Coff, distributedcenter Cen 
                     WHERE Coff.distributedCenterId = Cen.id AND (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ?

                 `;

        const countParams = [companyId];
        const dataParams = [companyId];

        // Apply filters for company ID
        if (center) {
            countSql += " AND Coff.distributedCenterId = ? ";
            dataSql += " AND Coff.distributedCenterId = ? ";
            countParams.push(center);
            dataParams.push(center);
        }

        if (status) {
            countSql += " AND Coff.status LIKE ? ";
            dataSql += " AND Coff.status LIKE ? ";
            countParams.push(status);
            dataParams.push(status);
        }

        if (role) {
            countSql += " AND Coff.jobRole LIKE ? ";
            dataSql += " AND Coff.jobRole LIKE ? ";
            countParams.push(role);
            dataParams.push(role);
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

        // dataSql += " ORDER BY Coff.createdAt DESC ";
        dataSql += " ORDER BY CASE WHEN Coff.empId LIKE 'DCH%' THEN 0 ELSE 1 END";


        // Add pagination to the data query
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


exports.getAllCompanyNamesDao = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, companyNameEnglish
            FROM company
            WHERE isDistributed = 1
        `;
        collectionofficer.query(sql, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.getDCHOwnCenters = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT CC.id, CC.centerName, CC.regCode
            FROM distributedcenter CC, distributedcompanycenter COMC
            WHERE COMC.centerId = CC.id AND COMC.companyId = ?
        `;

        collectionofficer.query(sql, [id], (err, results) => {
            if (err) {
                console.log('Error in getDCHOwnCenters query:', err);
                return reject(err);
            }
            resolve(results);
        });
    });
};
