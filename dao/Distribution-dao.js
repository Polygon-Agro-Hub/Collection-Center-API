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

exports.getAllOfficersForDCHDAO = (companyId, centerId, page, limit, status, role, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total
            FROM collectionofficer Coff
            WHERE (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ? AND Coff.distributedCenterId = ?
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
                     WHERE Coff.distributedCenterId = Cen.id AND (Coff.empId LIKE 'DCM%' OR Coff.empId LIKE 'DIO%') AND Coff.companyId = ? AND Coff.distributedCenterId = ?

                 `;

        const countParams = [companyId, centerId];
        const dataParams = [companyId, centerId];

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

exports.getDistributionCenterOfficerDao = (managerId, companyId) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT id, firstNameEnglish, lastNameEnglish, empId
        FROM collectionofficer
        WHERE companyId = ?
          AND (irmId = ? OR id = ?)
        ORDER BY empId
        `;

        collectionofficer.query(sql, [companyId, managerId, managerId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getCenterName = (managerId, companyId) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT dc.city, dc.district
        FROM collection_officer.collectionofficer co 
        JOIN collection_officer.distributedcenter dc ON co.distributedCenterId = dc.id
        WHERE co.id = ? AND co.companyId = ?
        `;

        collectionofficer.query(sql, [managerId, companyId], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

exports.getDistributionOrders = (deliveryLocationDataObj) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                po.id AS processOrderId,
                po.invNo,
                o.id AS orderId,
                po.status,
                po.isTargetAssigned,
                oh.city AS ohCity,
                oa.city AS oaCity,
                o.sheduleDate,
                o.sheduleTime
                
            FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            WHERE 
                (oh.city IN (?, ?) OR 
                oa.city IN (?, ?))
                AND o.sheduleDate >= CURDATE()
  AND o.sheduleDate < DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND po.isTargetAssigned = 0 AND po.status = 'Processing';
        `;

        const { city, district } = deliveryLocationDataObj;

        const params = [city, district, city, district];

        collectionofficer.query(sql, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


exports.assignDistributionTargetsDAO = (companyCenterId, formattedAssignments) => {
    console.log('dao', companyCenterId, formattedAssignments);
    return new Promise((resolve, reject) => {
      let dataSql = `
        INSERT INTO distributedtarget (companycenterId, userId, target, complete)
        VALUES ?
      `;
  
      // Build values array
      const values = formattedAssignments.map(assignment => [
        companyCenterId,
        assignment.officerId,
        assignment.count,
        0 // complete is always 0
      ]);
  
      collectionofficer.query(dataSql, [values], (err, results) => {
        if (err) {
          console.error('Insert Error:', err);
          return reject(err);
        }
        resolve(results);
      });
    });
  };


  exports.insertDistributedTargetItems = (itemsArray) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO distributedtargetitems (targetId, orderId)
        VALUES ?
      `;
  
      collectionofficer.query(sql, [itemsArray], (err, results) => {
        if (err) {
          console.error("Error inserting distributed target items:", err);
          return reject(err);
        }
        resolve(results);
      });
    });
  };

  exports.markProcessOrdersAsAssigned = (processOrderIds) => {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE market_place.processorders
        SET isTargetAssigned = 1
        WHERE id IN (?)
      `;
      collectionofficer.query(sql, [processOrderIds], (err, result) => {
        if (err) {
          console.error("Error updating processorders:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  };
  
  

exports.getCompanyCenterId = (manageId) => {
    return new Promise((resolve, reject) => {
        let dataSql = `
        SELECT dcc.id
        FROM collection_officer.company c
        JOIN collection_officer.distributedcompanycenter dcc ON dcc.companyId = c.id
        JOIN collection_officer.distributedcenter dc ON dc.id = dcc.centerId
        JOIN collection_officer.collectionofficer coff ON coff.distributedCenterId = dc.id
        WHERE coff.id = ? 
        `;
        const dataParams = [manageId];
        collectionofficer.query(dataSql, dataParams, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0].id);
        });
    });
};

exports.getAllReplaceProductsDao = (userId, companyId, page, limit, date, status, searchText) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.replacerequest rr
            JOIN market_place.orderpackage op ON rr.orderPackageId = op.id
            JOIN market_place.producttypes pt ON rr.productType = pt.id
            JOIN collection_officer.collectionofficer coff ON rr.userId = coff.id
            JOIN market_place.orderpackageitems opi ON rr.replceId = opi.id
            JOIN market_place.marketplaceitems mpi ON opi.productId = mpi.id
            WHERE (coff.irmId = ? OR coff.empId = ?) AND coff.companyId = ?
        `;

        let dataSql = `
        SELECT rr.id AS rrId,
        coff.id AS officerId,
        coff.empId,
        coff.firstNameEnglish,
        rr.replceId,
        rr.status,
        op.id AS orderPackageId,
        opi.productType AS currentProductTypeId,
        CAST(opi.qty AS DECIMAL(10,2)) AS currentProductQty,
        CAST(opi.price AS DECIMAL(10,2)) AS currentProductPrice,
        opi.isPacked,
        pt.shortCode AS currentprodcutType,
        pt.typeName AS currentProductTypeName,
        op.isLock,
        mpi.displayName AS currentProduct,
        rr.createdAt
 FROM market_place.replacerequest rr
 JOIN market_place.orderpackage op ON rr.orderPackageId = op.id
 JOIN collection_officer.collectionofficer coff ON rr.userId = coff.id
 JOIN market_place.orderpackageitems opi ON rr.replceId = opi.id
 JOIN market_place.producttypes pt ON opi.productType = pt.id
 JOIN market_place.marketplaceitems mpi ON opi.productId = mpi.id
 WHERE (coff.irmId = ? OR coff.empId = ?) AND coff.companyId = ?
 
        `;

        const countParams = [userId, userId, companyId];
        const dataParams = [userId, userId, companyId];

        if (date) {
            countSql += " AND DATE(rr.createdAt) = ?";
            dataSql += " AND DATE(rr.createdAt) = ?";
            countParams.push(date);
            dataParams.push(date);
        }

        if (status) {
            countSql += " AND rr.status = ?";
            dataSql += " AND rr.status = ?";
            countParams.push(status);
            dataParams.push(status);
        }

        if (searchText) {
            countSql += " AND mpi.displayName LIKE ?";
            dataSql += " AND mpi.displayName LIKE ?";
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue);
            dataParams.push(searchValue);
        }

        dataSql += " ORDER BY rr.createdAt LIMIT ? OFFSET ?";
        dataParams.push(parseInt(limit), parseInt(offset));

        // Execute queries
        collectionofficer.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Count query error:', countErr);
                return reject(new Error('Database error in count query'));
            }

            const total = countResults[0]?.total || 0;

            collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
                if (dataErr) {
                    console.error('Data query error:', dataErr);
                    return reject(new Error('Database error in data query'));
                }

                resolve({ 
                    items: dataResults, 
                    total: total
                });
            });
        });
    });
};

exports.getReplaceRequestDetails = (rrId) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
            SELECT 
                opi.id AS replaceId,  
                rr.productId AS replaceProductId,
                mpi.displayName AS replaceProduct, 
                CAST(rr.qty AS DECIMAL(10,2)) AS replaceQty, 
                CAST(rr.price AS DECIMAL(10,2)) AS replacePrice, 
                rr.productType AS replaceProductType,
                CAST(mpi.discountedPrice AS DECIMAL(10,2)) AS replaceUnitPrice 
            FROM market_place.replacerequest rr
            JOIN market_place.orderpackageitems opi ON rr.replceId = opi.id
            JOIN market_place.marketplaceitems mpi ON rr.productId = mpi.id
            WHERE rr.id = ?
        `;
        
        collectionofficer.query(dataSql, [rrId], (err, results) => {
            if (err) {
                console.error('SQL Error:', err);
                return reject(err);
            }
            resolve(results.length > 0 ? results[0] : {});
        });
    });
};

exports.replaceProduct = (approvedRequest) => {
    console.log('approvedRequest', approvedRequest)
    return new Promise((resolve, reject) => {
      // SQL query to update both tables
      const dataSql1 = `
        UPDATE orderpackageitems
        SET
          productId = ?,
          productType = ?,
          qty = ?,
          price = ?
        WHERE
          id = ?
      `;
  
      const values1 = [
        approvedRequest.replaceProductId,
        approvedRequest.replaceProductType,
        approvedRequest.replaceQty,
        approvedRequest.replacePrice,
        approvedRequest.replceId
      ];
  
      // First update orderpackageitems
      marketPlace.query(dataSql1, values1, (err1, results1) => {
        if (err1) {
          console.error('SQL Error (orderpackageitems):', err1);
          return reject(err1);
        }
  
        // Then update replacerequest
        const dataSql2 = `
          UPDATE replacerequest
          SET status = ?
          WHERE id = ?
        `;
  
        const values2 = [
          approvedRequest.status,
          approvedRequest.rrId
        ];
  
        marketPlace.query(dataSql2, values2, (err2, results2) => {
          if (err2) {
            console.error('SQL Error (replacerequest):', err2);
            return reject(err2);
          }
  
          resolve({
            success: true,
            updatedOrderPackageItems: results1.affectedRows,
            updatedReplaceRequest: results2.affectedRows
          });
        });
      });
    });
  };

  exports.rejectRequestDao = (approvedRequest) => {
    return new Promise((resolve, reject) => {
      const dataSql = `
        UPDATE replacerequest
        SET
          status = ?
        WHERE
          id = ?
      `;
  
      const values = [
        approvedRequest.status,
        approvedRequest.rrId
      ];
  
      marketPlace.query(dataSql, values, (err, results) => {
        if (err) {
          console.error('SQL Error:', err);
          return reject(err);
        }
  
        resolve({ success: true, updatedRows: results.affectedRows });
      });
    });
  };

  exports.dcmGetAllAssignOrdersDao = (userId, page, limit, status, searchText, deliveryLocationDataObj, date) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const { city, district } = deliveryLocationDataObj;


        const countParams = [city, district, city, district];
        const dataParams = [city, district, city, district];


        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
            LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
            LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
            WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
            AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
        `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
        AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    po.invNo LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue);
            dataParams.push(searchValue);
        }

        if (status) {
            countSql += ` AND po.packagePackStatus = ? `;
            dataSql += ` AND po.packagePackStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (date) {
            countSql += ` AND DATE(o.sheduleDate) = ? `;
            dataSql  += ` AND DATE(o.sheduleDate) = ? `;
            countParams.push(date);
            dataParams.push(date);
        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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


exports.dcmGetToDoAssignOrdersDao = (userId, page, limit, status, searchText, deliveryLocationDataObj, date) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const { city, district } = deliveryLocationDataObj;


        const countParams = [city, district, city, district];
        const dataParams = [city, district, city, district];


        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
            LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
            LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
            WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
            AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
            AND po.packagePackStatus != 'Completed'
        `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
        AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
        AND po.packagePackStatus != 'Completed'
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    po.invNo LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue);
            dataParams.push(searchValue);
        }

        if (status) {
            countSql += ` AND po.packagePackStatus = ? `;
            dataSql += ` AND po.packagePackStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (date) {
            countSql += ` AND DATE(o.sheduleDate) = ? `;
            dataSql  += ` AND DATE(o.sheduleDate) = ? `;
            countParams.push(date);
            dataParams.push(date);
        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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

exports.dcmGetCompletedAssignOrdersDao = (userId, page, limit, searchText, deliveryLocationDataObj, date) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const { city, district } = deliveryLocationDataObj;


        const countParams = [city, district, city, district];
        const dataParams = [city, district, city, district];


        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
            LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
            LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
            WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
            AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
            AND po.packagePackStatus = 'Completed'
        `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
        AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
        AND po.packagePackStatus = 'Completed'
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    po.invNo LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue);
            dataParams.push(searchValue);
        }

        if (date) {
            countSql += ` AND DATE(o.sheduleDate) = ? `;
            dataSql  += ` AND DATE(o.sheduleDate) = ? `;
            countParams.push(date);
            dataParams.push(date);
        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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

exports.dcmGetOutForDeliveryOrdersDao = (userId, page, limit, status, searchText, deliveryLocationDataObj) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;

        const { city, district } = deliveryLocationDataObj;

        const countParams = [city, district, city, district];
        const dataParams = [city, district, city, district];

        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
            LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
            LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
            WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
            AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
            AND po.packagePackStatus != 'Completed'
        `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
        AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
        AND po.packagePackStatus != 'Completed'
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    po.invNo LIKE ?
                )
            `;
            countSql += searchCondition;
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            countParams.push(searchValue);
            dataParams.push(searchValue);
        }

        if (status) {
            countSql += ` AND po.packagePackStatus = ? `;
            dataSql += ` AND po.packagePackStatus = ? `;
            countParams.push(status);
            dataParams.push(status);

        }

        if (date) {
            countSql += ` AND DATE(o.sheduleDate) = ? `;
            dataSql  += ` AND DATE(o.sheduleDate) = ? `;
            countParams.push(date);
            dataParams.push(date);
        }


        dataSql += " LIMIT ? OFFSET ? ";
        dataParams.push(limit, offset);

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
  

