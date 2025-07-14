const { plantcare, collectionofficer, marketPlace, dash } = require('../startup/database');

exports.getDistributionCenterDetailsDao = (companyId, province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters
        if (!companyId) {
            return reject(new Error('Company ID is required'));
        }

        page = page || 1;
        limit = limit || 10;

        // Base count query to get total number of centers
        let countSql = `
            SELECT COUNT(DISTINCT dc.id) AS totalCount
            FROM 
                distributedcompanycenter dcc
            JOIN 
                company c ON dcc.companyId = c.id
            JOIN 
                distributedcenter dc ON dcc.centerId = dc.id
            LEFT JOIN 
                collectionofficer cof ON cof.centerId = dc.id
            WHERE 
                dcc.companyId = 5 AND c.isDistributed = 1
        `;

        // Base data query to fetch center details
        let dataSql = `
        SELECT 
        dc.id AS centerId,
        dc.regCode,
        dc.centerName, 
        dc.city,
        dc.province,
        dc.district,
        dc.contact01,
        dc.contact02,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Collection Officer' THEN 1 ELSE 0 END), 0) AS collectionOfficerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Customer Officer' THEN 1 ELSE 0 END), 0) AS customerOfficerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Collection Center Manager' THEN 1 ELSE 0 END), 0) AS collectionCenterManagerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Customer Service' THEN 1 ELSE 0 END), 0) AS customerServiceCount
    FROM 
        distributedcompanycenter dcc
    JOIN 
        company c ON dcc.companyId = c.id
    JOIN 
        distributedcenter dc ON dcc.centerId = dc.id
    LEFT JOIN 
        collectionofficer cof ON cof.centerId = dc.id
    WHERE 
        dcc.companyId = ? AND c.isDistributed = 1
        `;

        // Prepare query parameters
        const queryParams = [companyId];
        const countParams = [companyId];

        // Add conditions for province if provided
        if (province) {
            dataSql += ` AND dc.province = ?`;
            countSql += ` AND dc.province = ?`;
            queryParams.push(province);
            countParams.push(province);
        }

        // Add conditions for district if provided
        if (district) {
            dataSql += ` AND dc.district = ?`;
            countSql += ` AND dc.district = ?`;
            queryParams.push(district);
            countParams.push(district);
        }

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (dc.centerName LIKE ? OR dc.regCode LIKE ?)`;
            countSql += ` AND (dc.centerName LIKE ? OR dc.regCode LIKE ?)`;
            queryParams.push(`%${searchText}%`, `%${searchText}%`);
            countParams.push(`%${searchText}%`, `%${searchText}%`);
        }

        // Group the results by center details
        dataSql += `
            GROUP BY 
            dc.id, dc.regCode, dc.centerName, dc.province, 
            dc.district, dc.contact01, dc.contact02
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

exports.createDistributionCenter = (centerData, companyId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate input data
            if (!centerData || !centerData.DistributionCenterName) {
                return reject(new Error("Center data is missing or incomplete"));
            }

            // SQL query to check for duplicate regCode
            const checkDuplicateSQL = `
                SELECT regCode FROM distributedcenter WHERE regCode = ?
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
                        INSERT INTO distributedcenter (
                            regCode, centerName, district, province, city, country, latitude, longitude
                        ) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    // Execute the query to insert data into collectioncenter
                    collectionofficer.query(
                        insertCenterSQL,
                        [
                            centerData.regCode,
                            centerData.DistributionCenterName,
                            centerData.district,
                            centerData.province,
                            centerData.city,
                            centerData.country,
                            centerData.latitude,
                            centerData.longitude
                        ],
                        (err, centerResults) => {
                            if (err) {
                                console.error("Database Error (distributedcenter):", err);
                                return reject(err);
                            }

                            // Get the inserted ID for collectioncenter
                            const centerId = centerResults.insertId;

                            // SQL query to insert data into companycenter
                            const insertCompanyCenterSQL = `
                                INSERT INTO distributedcompanycenter (centerId, companyId)
                                VALUES (?, ?)
                            `;

                            // Execute the query to insert data into companycenter
                            collectionofficer.query(
                                insertCompanyCenterSQL,
                                [centerId, companyId],
                                (err, companyCenterResults) => {
                                    if (err) {
                                        console.error("Database Error (distributedcompanycenter):", err);
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