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
                dcc.companyId = ? AND c.isDistributed = 1
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
        dc.latitude,
        dc.longitude,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Distribution Officer' THEN 1 ELSE 0 END), 0) AS distributionOfficerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Customer Officer' THEN 1 ELSE 0 END), 0) AS customerOfficerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Distribution Centre Manager' THEN 1 ELSE 0 END), 0) AS distributionCenterManagerCount,
        COALESCE(SUM(CASE WHEN cof.jobRole = 'Customer Service' THEN 1 ELSE 0 END), 0) AS customerServiceCount
    FROM 
        distributedcompanycenter dcc
    JOIN 
        company c ON dcc.companyId = c.id
    JOIN 
        distributedcenter dc ON dcc.centerId = dc.id
    LEFT JOIN 
        collectionofficer cof ON cof.distributedCenterId = dc.id
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
            ORDER BY dc.createdAt DESC
        `;

        countSql += ` ORDER BY dc.createdAt DESC`;

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
                            regCode, centerName, district, province, city, country, latitude, longitude, code1, contact01, code2, contact02, email
                        ) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                            centerData.longitude,
                            centerData.phoneNumber01Code,
                            centerData.phoneNumber01,
                            centerData.phoneNumber02Code,
                            centerData.phoneNumber02,
                            centerData.email
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

exports.getDistributedCompanyCenter = (managerId, companyId, centerId) => {
  return new Promise((resolve, reject) => {
      const sql = `
      SELECT dcc.id AS companyCenterId
      FROM collection_officer.distributedcompanycenter dcc 
      JOIN collection_officer.distributedcenter dc ON dcc.centerId = dc.id
      JOIN collection_officer.company c ON dcc.companyId = c.id
      WHERE c.id = ? AND dc.id = ?
      `;

      collectionofficer.query(sql, [companyId, centerId], (err, results) => {
          if (err) {
              return reject(err);
          }
          resolve(results);
      });
  });
};

exports.getDeliveryChargeCity = (companyCenterId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT dc.city 
      FROM collection_officer.centerowncity coc
      LEFT JOIN collection_officer.deliverycharge dc 
        ON coc.cityId = dc.id
      WHERE coc.companyCenterId = ?
    `;

    collectionofficer.query(sql, [companyCenterId], (err, results) => {
      if (err) {
        return reject(err);
      }

      // Map result rows into an array of city values
      const cities = results.map(row => row.city);
      resolve(cities);
    });
  });
};

exports.getDistributionOrders = (deliveryLocationData, centerId) => {
  return new Promise((resolve, reject) => {
    let sql = `
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
      LEFT JOIN market_place.orderpackage op ON op.orderId = po.id
      WHERE 
          (
            ${deliveryLocationData && deliveryLocationData.length > 0
              ? "(oh.city IN (?) OR oa.city IN (?)) OR"
              : ""}
            o.centerId = ?
          )
          AND o.sheduleDate >= CURDATE()
          AND o.sheduleDate < DATE_ADD(CURDATE(), INTERVAL 3 DAY)
          AND (po.isTargetAssigned IS NULL OR po.isTargetAssigned != 1)
          AND po.status = 'Processing' AND (op.packingStatus = 'Dispatch' OR op.packingStatus IS NULL)
    `;

    const params = [];

    if (deliveryLocationData && deliveryLocationData.length > 0) {
      params.push(deliveryLocationData, deliveryLocationData);
      console.log('params', params)
    }

    params.push(centerId);

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
            SELECT COUNT(*) AS total 
            FROM replacerequest rp
            JOIN orderpackage op ON rp.orderPackageId = op.id
            LEFT JOIN orderpackageitems opi ON rp.replceId = opi.id
            LEFT JOIN producttypes pt ON pt.id = opi.productType
            LEFT JOIN marketplaceitems mpi1 ON rp.productId = mpi1.id 
            LEFT JOIN marketplaceitems mpi2 ON opi.productId = mpi2.id
            LEFT JOIN prevdefineproduct pdp ON pdp.replceId = opi.id
            LEFT JOIN marketplaceitems mpi3 ON pdp.productId = mpi3.id
            LEFT JOIN producttypes pt1 ON rp.productType = pt1.id
            LEFT JOIN producttypes pt2 ON opi.productType = pt2.id
            LEFT JOIN producttypes pt3 ON pdp.productType = pt3.id 
            JOIN collection_officer.collectionofficer coff ON rp.userId = coff.id
            WHERE (coff.irmId = ? OR coff.empId = ?) AND coff.companyId = ?
        `;

        let dataSql = `

        SELECT 
            rp.id AS rrId,
            op.id AS orderPackageId,
            rp.status AS status, 
            rp.replceId,
            coff.id AS officetId,
            coff.empId AS empId,
            coff.firstNameEnglish,
            coff.lastNameEnglish,
            mpi1.id AS replaceProductId,
            mpi1.displayName AS replaceProduct,
            CAST(mpi1.discountedPrice AS DECIMAL(10,2)) AS replaceUnitPrice,
            mpi1.unitType AS replaceUnitType,
            CAST(rp.qty AS DECIMAL(10,2)) AS replaceQty,
            CAST(rp.price AS DECIMAL(10,2)) AS replacePrice,
            mpi2.id AS currentProductId,
            mpi2.displayName AS currentProduct,
            CAST(mpi2.discountedPrice AS DECIMAL(10,2)) AS currentProductUnitPrice,
            mpi2.unitType AS currentProductUnitTypeId,
            pt2.shortCode AS currentProductShortCode,
            pt2.typeName AS currentProductTypeName,
            pt2.id AS currentProductTypeId,
            CAST(opi.qty AS DECIMAL(10,2)) AS currentProductQty,
            CAST(opi.price AS DECIMAL(10,2)) AS currentProductPrice,

            mpi3.id AS prevDefineProductId,
            mpi3.displayName AS prevDefineProduct,
            CAST(mpi3.discountedPrice AS DECIMAL(10,2)) AS prevDefineProductUnitPrice,
            mpi3.unitType AS prevDefineProductUnitTypeId,
            pt3.shortCode AS prevDefineProductShortCode,
            pt3.typeName AS prevDefineProductTypeName,
            pt3.id AS prevDefineProductTypeId,
            CAST(pdp.qty AS DECIMAL(10,2)) AS prevDefineProductQty, 
            CAST(pdp.price AS DECIMAL(10,2)) AS prevDefineProductPrice,
            opi.isPacked,
            op.isLock
        FROM replacerequest rp
        JOIN orderpackage op ON rp.orderPackageId = op.id
        LEFT JOIN orderpackageitems opi ON rp.replceId = opi.id
        LEFT JOIN producttypes pt ON pt.id = opi.productType
        LEFT JOIN marketplaceitems mpi1 ON rp.productId = mpi1.id 
        LEFT JOIN marketplaceitems mpi2 ON opi.productId = mpi2.id
        LEFT JOIN prevdefineproduct pdp ON pdp.replceId = opi.id
        LEFT JOIN marketplaceitems mpi3 ON pdp.productId = mpi3.id
        LEFT JOIN producttypes pt1 ON rp.productType = pt1.id
        LEFT JOIN producttypes pt2 ON opi.productType = pt2.id
        LEFT JOIN producttypes pt3 ON pdp.productType = pt3.id 
        JOIN collection_officer.collectionofficer coff ON rp.userId = coff.id
        WHERE (coff.irmId = ? OR coff.empId = ?) AND coff.companyId = ?
        
        `;

        const countParams = [userId, userId, companyId];
        const dataParams = [userId, userId, companyId];

        if (date) {
            countSql += " AND DATE(rp.createdAt) = ?";
            dataSql += " AND DATE(rp.createdAt) = ?";
            countParams.push(date);
            dataParams.push(date);
        }

        if (status) {
            countSql += " AND rp.status = ?";
            dataSql += " AND rp.status = ?";
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

        dataSql += " ORDER BY rp.createdAt LIMIT ? OFFSET ?";
        dataParams.push(parseInt(limit), parseInt(offset));

        // Execute queries
        marketPlace.query(countSql, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Count query error:', countErr);
                return reject(new Error('Database error in count query'));
            }

            const total = countResults[0]?.total || 0;

            marketPlace.query(dataSql, dataParams, (dataErr, dataResults) => {
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

// SELECT rr.id AS rrId,
//         coff.id AS officerId,
//         coff.empId,
//         coff.firstNameEnglish,
//         rr.replceId,
//         rr.status,
//         op.id AS orderPackageId,
//         opi.productType AS currentProductTypeId,
//         CAST(opi.qty AS DECIMAL(10,2)) AS currentProductQty,
//         CAST(opi.price AS DECIMAL(10,2)) AS currentProductPrice,
//         opi.isPacked,
//         pt.shortCode AS currentprodcutType,
//         pt.typeName AS currentProductTypeName,
//         op.isLock,
//         mpi.displayName AS currentProduct,
//         rr.createdAt
//  FROM market_place.replacerequest rr
//  JOIN market_place.orderpackage op ON rr.orderPackageId = op.id
//  JOIN collection_officer.collectionofficer coff ON rr.userId = coff.id
//  JOIN market_place.orderpackageitems opi ON rr.replceId = opi.id
//  JOIN market_place.producttypes pt ON opi.productType = pt.id
//  JOIN market_place.marketplaceitems mpi ON opi.productId = mpi.id
//  WHERE (coff.irmId = ? OR coff.empId = ?) AND coff.companyId = ?

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
                CAST(mpi.discountedPrice AS DECIMAL(10,2)) AS replaceUnitPrice,
                mpi.unitType AS replaceUnitType
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
      const dataSql1 = `
        UPDATE orderpackageitems
        SET
          productId = ?,
          qty = ?,
          price = ?
        WHERE
          id = ? 
      `;
  
      const values1 = [
        approvedRequest.replaceProductId,
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
  
        // Second query → Insert into prevdefineproduct
        const dataSqlExtra = `
        INSERT INTO prevdefineproduct (
            replceId,
            orderPackageId,
            productType,
            productId,
            qty,
            price
        ) VALUES (?, ?, ?, ?, ?, ?)
        
        `;
  
        const valuesExtra = [
          approvedRequest.replceId,
          approvedRequest.orderPackageId,
          approvedRequest.prevProductTypeId,
          approvedRequest.prevProductId,
          approvedRequest.prevProductQty,   
          approvedRequest.prevProductPrice
        ];
  
        marketPlace.query(dataSqlExtra, valuesExtra, (errExtra, resultsExtra) => {
          if (errExtra) {
            console.error('SQL Error (prevdefineproduct):', errExtra);
            return reject(errExtra);
          }
  
          // Third query → Update replacerequest
          const dataSql2 = `
            UPDATE replacerequest
            SET status = 'Approved'
            WHERE id = ?
          `;
  
          const values2 = [approvedRequest.rrId];
  
          marketPlace.query(dataSql2, values2, (err2, results2) => {
            if (err2) {
              console.error('SQL Error (replacerequest):', err2);
              return reject(err2);
            }
  
            // 🔹 Fourth query → Example: Update orders table (or any other action)
            const dataSql3 = `
              UPDATE orderpackage
              SET isLock = 0
              WHERE id = ?
            `;
  
            const values3 = [approvedRequest.orderPackageId];
  
            marketPlace.query(dataSql3, values3, (err3, results3) => {
              if (err3) {
                console.error('SQL Error (orders):', err3);
                return reject(err3);
              }
  
              resolve({
                success: true,
                updatedOrderPackageItems: results1.affectedRows,
                insertedPrevDefineProduct: resultsExtra.affectedRows,
                updatedReplaceRequest: results2.affectedRows,
                updatedOrders: results3.affectedRows
              });
            });
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
          status = 'Rejected'
        WHERE
          id = ?
      `;
  
      const values = [approvedRequest.rrId];
  
      // First query → Update replacerequest
      marketPlace.query(dataSql, values, (err, results1) => {
        if (err) {
          console.error('SQL Error (replacerequest):', err);
          return reject(err);
        }
  
        // 🔹 Second query → Example: insert into rejection log table
        const dataSql2 = `
        UPDATE orderpackage
        SET isLock = 0
        WHERE id = ?
        `;
  
        const values2 = [
            approvedRequest.orderPackageId
        ];
  
        marketPlace.query(dataSql2, values2, (err2, results2) => {
          if (err2) {
            console.error('SQL Error (rejectionlog):', err2);
            return reject(err2);
          }
  
          resolve({
            success: true,
            updatedReplaceRequest: results1.affectedRows,
            insertedRejectionLog: results2.affectedRows
          });
        });
      });
    });
  };

  exports.dcmGetAllAssignOrdersDao = (packageStatus, search, deliveryLocationData, date, centerId) => {
    console.log('fetching')
    
    return new Promise((resolve, reject) => {

      const params = [];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        params.push(deliveryLocationData, deliveryLocationData);
      }
  
      params.push(centerId);
  
      let whereClause = ` 
      WHERE 
      po.status = 'Processing'
      AND po.isTargetAssigned = 1 
      AND (
        (o.isPackage = 1 AND op.packingStatus != 'Todo') 
        OR o.isPackage = 0
      )
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
       `;
  
     
  
      if (search) {
        whereClause += ` AND (po.invNo LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern);
      }

      if (date) {
        whereClause +=  ` AND DATE(o.sheduleDate) = ? `;
        params.push(date);
    }

    // if (packageStatus) {
    //     if (packageStatus === 'Pending') {
    //       whereClause += ` 
    //     AND (
    //       (pic.packedItems = 0 AND pic.totalItems > 0) 
    //       OR 
    //       (COALESCE(aic.packedAdditionalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0)
    //     )
    //   `;
    //     } else if (packageStatus === 'Completed') {
    //       whereClause += ` 
    //     AND (
    //       (pic.totalItems > 0 AND pic.packedItems = pic.totalItems) 
    //       OR 
    //       (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
    //     )
    //   `;
    //     } else if (packageStatus === 'Opened') {
    //       whereClause += ` 
    //     AND (
    //       (pic.packedItems > 0 AND pic.totalItems > pic.packedItems) 
    //       OR 
    //       (COALESCE(aic.packedAdditionalItems, 0) > 0 AND COALESCE(aic.totalAdditionalItems, 0) > COALESCE(aic.packedAdditionalItems, 0))
    //     )
    //   `;
    //     }
    //   }

      if (packageStatus) {
        if (packageStatus === 'Pending') {
          // Truly pending: BOTH package items AND additional items have no packed items
          // OR only one type exists and it's not started
          whereClause += ` 
            AND (
              -- Case 1: Both types exist, both are not started
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
              OR
              -- Case 2: Only package items exist, not started
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
               AND pic.packedItems = 0)
              OR
              -- Case 3: Only additional items exist, not started  
              (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = 0)
            )
          `;
        } else if (packageStatus === 'Completed') {
          // Completed: ALL existing items (both types) are packed
          whereClause += ` 
            AND (
              -- Case 1: Both types exist, both completed
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = pic.totalItems 
               AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Case 2: Only package items exist, completed
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
               AND pic.packedItems = pic.totalItems)
              OR
              -- Case 3: Only additional items exist, completed
              (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
            )
          `;
        } else if (packageStatus === 'Opened') {
          // Opened: At least one item packed, but not all items packed
          // This means partially completed from any type
          whereClause += ` 
            AND (
              -- Has some progress but not fully completed
              (
                -- Some package items packed but not all
                (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
                OR
                -- Some additional items packed but not all  
                (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
                 AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
                OR
                -- Package items completed but additional items not started/partial
                (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
                 AND pic.packedItems = pic.totalItems 
                 AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
                OR
                -- Additional items completed but package items not started/partial  
                (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
                 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
                 AND pic.packedItems < pic.totalItems)
              )
            )
          `;
        }
    }

        
  
      const dataSql = `
      WITH package_item_counts AS (
        SELECT 
            op.orderId,
            COUNT(*) AS totalItems,
            SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
            CASE
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                    AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
                ELSE 'Unknown'
            END AS packageStatus
        FROM orderpackageitems opi
        JOIN orderpackage op ON opi.orderPackageId = op.id
        GROUP BY op.orderId
    ),
    additional_items_counts AS (
        SELECT 
            orderId,
            COUNT(*) AS totalAdditionalItems,
            SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
            CASE
                WHEN COUNT(*) = 0 THEN 'Unknown'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                     AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
                ELSE 'Unknown'
            END AS additionalItemsStatus
        FROM orderadditionalitems
        GROUP BY orderId
    )
          
    SELECT 
    o.id,
    po.id AS processOrderId,
    po.invNo,
    o.sheduleDate,
    o.sheduleTime,
    dti.id AS distributedTargetItemId, 
    dt.id AS distributedTargetId, 
    dti.isComplete,
    dt.userId,
    coff.empId, 
    coff.firstNameEnglish, 
    coff.lastNameEnglish,
    po.outDlvrDate,
    COUNT(DISTINCT op.id) AS packageCount,
    SUM(DISTINCT mpi.productPrice) AS packagePrice,
    COALESCE(pic.totalItems, 0) AS totPackageItems,
    COALESCE(pic.packedItems, 0) AS packPackageItems,
    COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
    COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
    COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
    COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
        ${whereClause}
        GROUP BY
    o.id,
    po.id,
    po.invNo,
    o.sheduleDate,
    dti.id,
    dt.id,
    dti.isComplete,
    dt.userId,
    coff.empId,
    coff.firstNameEnglish,
    coff.lastNameEnglish,
    po.outDlvrDate,
    pic.totalItems,
    pic.packedItems,
    pic.packageStatus,
    aic.totalAdditionalItems,
    aic.packedAdditionalItems,
    aic.additionalItemsStatus;

        `;
  
    
        console.log('Executing Data Query...');
        marketPlace.query(dataSql, params, (dataErr, dataResults) => {
          if (dataErr) {
            console.error("Error in data query:", dataErr);
            return reject(dataErr);
          }
          console.log('dataResults', dataResults)
          resolve({
            items: dataResults
          });
        });
      });
  };

//   exports.dcmGetAllAssignOrdersDao = (userId, page, limit, status, searchText, deliveryLocationDataObj, date) => {
//     return new Promise((resolve, reject) => {
//         const offset = (page - 1) * limit;

//         const { city, district } = deliveryLocationDataObj;


//         const countParams = [city, district, city, district];
//         const dataParams = [city, district, city, district];


//         let countSql = `
//             SELECT COUNT(*) AS total FROM market_place.processorders po
//             LEFT JOIN market_place.orders o ON o.id = po.orderId
//             LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//             LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//             LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//             LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//             LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//             WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//             AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         `;

//         let dataSql = `
//         SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
//         po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//         LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//         LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//         WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//         AND (oh.city IN (?, ?) OR oa.city IN (?, ?))

        
//         `;

        

//         if (searchText) {
//             const searchCondition = `
//                 AND (
//                     po.invNo LIKE ?
//                 )
//             `;
//             countSql += searchCondition;
//             dataSql += searchCondition;
//             const searchValue = `%${searchText}%`;
//             countParams.push(searchValue);
//             dataParams.push(searchValue);
//         }

//         if (status) {
//             countSql += ` AND po.packagePackStatus = ? `;
//             dataSql += ` AND po.packagePackStatus = ? `;
//             countParams.push(status);
//             dataParams.push(status);

//         }

//         if (date) {
//             countSql += ` AND DATE(o.sheduleDate) = ? `;
//             dataSql  += ` AND DATE(o.sheduleDate) = ? `;
//             countParams.push(date);
//             dataParams.push(date);
//         }


//         dataSql += " LIMIT ? OFFSET ? ";
//         dataParams.push(limit, offset);

//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };


exports.dcmGetToDoAssignOrdersDao = (packageStatus, search, deliveryLocationData, date, centerId) => {
    console.log('fetching')

    return new Promise((resolve, reject) => {

      const params = [];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        params.push(deliveryLocationData, deliveryLocationData);
      }
  
      params.push(centerId);
  
      let whereClause = ` 
      WHERE 
      po.status = 'Processing'
      AND po.isTargetAssigned = 1 
      AND (
        (o.isPackage = 1 AND op.packingStatus != 'Todo') 
        OR o.isPackage = 0
      )
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
      AND (
        -- Only include Pending and Opened orders
        -- Pending: No items packed from any type
        (
          -- Case 1: Both types exist, both are not started
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
          OR
          -- Case 2: Only package items exist, not started
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
           AND pic.packedItems = 0)
          OR
          -- Case 3: Only additional items exist, not started  
          (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND COALESCE(aic.packedAdditionalItems, 0) = 0)
        )
        OR
        -- Opened: At least one item packed, but not all items packed
        (
          -- Some package items packed but not all
          (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
          OR
          -- Some additional items packed but not all  
          (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
           AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
          OR
          -- Package items completed but additional items not started/partial
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND pic.packedItems = pic.totalItems 
           AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
          OR
          -- Additional items completed but package items not started/partial  
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
           AND pic.packedItems < pic.totalItems)
        )
      )
       `;
  
      if (search) {
        whereClause += ` AND (po.invNo LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern);
      }

      if (date) {
        whereClause +=  ` AND DATE(o.sheduleDate) = ? `;
        params.push(date);
    }

      // Optional: Keep the packageStatus filter for frontend compatibility
      // Now it will further filter within Pending/Opened results
      if (packageStatus) {
        if (packageStatus === 'Pending') {
          whereClause += ` 
            AND (
              -- Case 1: Both types exist, both are not started
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
              OR
              -- Case 2: Only package items exist, not started
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
               AND pic.packedItems = 0)
              OR
              -- Case 3: Only additional items exist, not started  
              (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = 0)
            )
          `;
        } else if (packageStatus === 'Opened') {
          whereClause += ` 
            AND (
              -- Some package items packed but not all
              (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
              OR
              -- Some additional items packed but not all  
              (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Package items completed but additional items not started/partial
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = pic.totalItems 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Additional items completed but package items not started/partial  
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
               AND pic.packedItems < pic.totalItems)
            )
          `;
        }
        // Note: Removed 'Completed' case since we don't want completed orders
    }

      const dataSql = `
      WITH package_item_counts AS (
        SELECT 
            op.orderId,
            COUNT(*) AS totalItems,
            SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
            CASE
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                    AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
                ELSE 'Unknown'
            END AS packageStatus
        FROM orderpackageitems opi
        JOIN orderpackage op ON opi.orderPackageId = op.id
        GROUP BY op.orderId
    ),
    additional_items_counts AS (
        SELECT 
            orderId,
            COUNT(*) AS totalAdditionalItems,
            SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
            CASE
                WHEN COUNT(*) = 0 THEN 'Unknown'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                     AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
                ELSE 'Unknown'
            END AS additionalItemsStatus
        FROM orderadditionalitems
        GROUP BY orderId
    )
          
    SELECT 
    o.id,
    po.id AS processOrderId,
    po.invNo,
    o.sheduleDate,
    o.sheduleTime,
    dti.id AS distributedTargetItemId, 
    dt.id AS distributedTargetId, 
    dti.isComplete,
    dt.userId,
    coff.empId, 
    coff.firstNameEnglish, 
    coff.lastNameEnglish,
    po.outDlvrDate,
    COUNT(DISTINCT op.id) AS packageCount,
    SUM(DISTINCT mpi.productPrice) AS packagePrice,
    COALESCE(pic.totalItems, 0) AS totPackageItems,
    COALESCE(pic.packedItems, 0) AS packPackageItems,
    COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
    COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
    COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
    COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
        ${whereClause}
        GROUP BY
    o.id,
    po.id,
    po.invNo,
    o.sheduleDate,
    dti.id,
    dt.id,
    dti.isComplete,
    dt.userId,
    coff.empId,
    coff.firstNameEnglish,
    coff.lastNameEnglish,
    po.outDlvrDate,
    pic.totalItems,
    pic.packedItems,
    pic.packageStatus,
    aic.totalAdditionalItems,
    aic.packedAdditionalItems,
    aic.additionalItemsStatus;

        `;
  
    
        console.log('Executing Data Query...');
        marketPlace.query(dataSql, params, (dataErr, dataResults) => {
          if (dataErr) {
            console.error("Error in data query:", dataErr);
            return reject(dataErr);
          }
          console.log('dataResults', dataResults)
          resolve({
            items: dataResults
          });
        });
      });
  };


// exports.dcmGetToDoAssignOrdersDao = (userId, page, limit, status, searchText, deliveryLocationDataObj, date) => {
//     return new Promise((resolve, reject) => {
//         const offset = (page - 1) * limit;

//         const { city, district } = deliveryLocationDataObj;


//         const countParams = [city, district, city, district];
//         const dataParams = [city, district, city, district];


//         let countSql = `
//             SELECT COUNT(*) AS total FROM market_place.processorders po
//             LEFT JOIN market_place.orders o ON o.id = po.orderId
//             LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//             LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//             LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//             LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//             LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//             WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//             AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//             AND po.packagePackStatus != 'Completed'
//         `;

//         let dataSql = `
//         SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
//         po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//         LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//         LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//         WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//         AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         AND po.packagePackStatus != 'Completed'
//         `;

//         if (searchText) {
//             const searchCondition = `
//                 AND (
//                     po.invNo LIKE ?
//                 )
//             `;
//             countSql += searchCondition;
//             dataSql += searchCondition;
//             const searchValue = `%${searchText}%`;
//             countParams.push(searchValue);
//             dataParams.push(searchValue);
//         }

//         if (status) {
//             countSql += ` AND po.packagePackStatus = ? `;
//             dataSql += ` AND po.packagePackStatus = ? `;
//             countParams.push(status);
//             dataParams.push(status);

//         }

//         if (date) {
//             countSql += ` AND DATE(o.sheduleDate) = ? `;
//             dataSql  += ` AND DATE(o.sheduleDate) = ? `;
//             countParams.push(date);
//             dataParams.push(date);
//         }


//         dataSql += " LIMIT ? OFFSET ? ";
//         dataParams.push(limit, offset);

//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };


exports.dcmGetCompletedAssignOrdersDao = (search, deliveryLocationData, date, centerId) => {
    console.log('fetching')

    return new Promise((resolve, reject) => {

      const params = [];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        params.push(deliveryLocationData, deliveryLocationData);
      }
  
      params.push(centerId);
  
      let whereClause = ` 
      WHERE 
      po.status = 'Processing'
      AND po.isTargetAssigned = 1 
      AND (
        (o.isPackage = 1 AND op.packingStatus != 'Todo') 
        OR o.isPackage = 0
      )
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
      AND (
        -- Only include Completed orders
        -- Completed: ALL existing items (both types) are packed
        (
          -- Case 1: Both types exist, both completed
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND pic.packedItems = pic.totalItems 
           AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
          OR
          -- Case 2: Only package items exist, completed
          (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
           AND pic.packedItems = pic.totalItems)
          OR
          -- Case 3: Only additional items exist, completed
          (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
           AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
        )
      )
       `;
  
      if (search) {
        whereClause += ` AND (po.invNo LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern);
      }

      if (date) {
        whereClause +=  ` AND DATE(o.sheduleDate) = ? `;
        params.push(date);
    }

    // No packageStatus filtering needed for completed orders
    // All results will be completed by default

      const dataSql = `
      WITH package_item_counts AS (
        SELECT 
            op.orderId,
            COUNT(*) AS totalItems,
            SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
            CASE
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                    AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
                ELSE 'Unknown'
            END AS packageStatus
        FROM orderpackageitems opi
        JOIN orderpackage op ON opi.orderPackageId = op.id
        GROUP BY op.orderId
    ),
    additional_items_counts AS (
        SELECT 
            orderId,
            COUNT(*) AS totalAdditionalItems,
            SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
            CASE
                WHEN COUNT(*) = 0 THEN 'Unknown'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                     AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
                ELSE 'Unknown'
            END AS additionalItemsStatus
        FROM orderadditionalitems
        GROUP BY orderId
    )
          
    SELECT 
    o.id,
    po.id AS processOrderId,
    po.invNo,
    o.sheduleDate,
    o.sheduleTime,
    dti.id AS distributedTargetItemId, 
    dt.id AS distributedTargetId, 
    dti.isComplete,
    dt.userId,
    coff.empId, 
    coff.firstNameEnglish, 
    coff.lastNameEnglish,
    po.outDlvrDate,
    COUNT(DISTINCT op.id) AS packageCount,
    SUM(DISTINCT mpi.productPrice) AS packagePrice,
    COALESCE(pic.totalItems, 0) AS totPackageItems,
    COALESCE(pic.packedItems, 0) AS packPackageItems,
    COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
    COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
    COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
    COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
        ${whereClause}
        GROUP BY
    o.id,
    po.id,
    po.invNo,
    o.sheduleDate,
    dti.id,
    dt.id,
    dti.isComplete,
    dt.userId,
    coff.empId,
    coff.firstNameEnglish,
    coff.lastNameEnglish,
    po.outDlvrDate,
    pic.totalItems,
    pic.packedItems,
    pic.packageStatus,
    aic.totalAdditionalItems,
    aic.packedAdditionalItems,
    aic.additionalItemsStatus;

        `;
  
    
        console.log('Executing Data Query...');
        marketPlace.query(dataSql, params, (dataErr, dataResults) => {
          if (dataErr) {
            console.error("Error in data query:", dataErr);
            return reject(dataErr);
          }
          console.log('dataResults', dataResults)
          resolve({
            items: dataResults
          });
        });
      });
  };

// exports.dcmGetCompletedAssignOrdersDao = (userId, page, limit, searchText, deliveryLocationDataObj, date) => {
//     return new Promise((resolve, reject) => {
//         const offset = (page - 1) * limit;

//         const { city, district } = deliveryLocationDataObj;


//         const countParams = [city, district, city, district];
//         const dataParams = [city, district, city, district];


//         let countSql = `
//             SELECT COUNT(*) AS total FROM market_place.processorders po
//             LEFT JOIN market_place.orders o ON o.id = po.orderId
//             LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//             LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//             LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//             LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//             LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//             WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//             AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//             AND po.packagePackStatus = 'Completed'
//         `;

//         let dataSql = `
//         SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate,
//         po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish FROM market_place.processorders po
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
//         LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
//         LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
//         WHERE po.status = 'Processing' AND po.isTargetAssigned = 1
//         AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         AND po.packagePackStatus = 'Completed'
//         `;

//         if (searchText) {
//             const searchCondition = `
//                 AND (
//                     po.invNo LIKE ?
//                 )
//             `;
//             countSql += searchCondition;
//             dataSql += searchCondition;
//             const searchValue = `%${searchText}%`;
//             countParams.push(searchValue);
//             dataParams.push(searchValue);
//         }

//         if (date) {
//             countSql += ` AND DATE(o.sheduleDate) = ? `;
//             dataSql  += ` AND DATE(o.sheduleDate) = ? `;
//             countParams.push(date);
//             dataParams.push(date);
//         }


//         dataSql += " LIMIT ? OFFSET ? ";
//         dataParams.push(limit, offset);

//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };

exports.dcmGetOutForDeliveryOrdersDao = (status, searchText, deliveryLocationData, centerId) => {
    return new Promise((resolve, reject) => {


      const dataParams = [];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        dataParams.push(deliveryLocationData, deliveryLocationData);
      }
  
      dataParams.push(centerId);

        // let countSql = `
        //     SELECT COUNT(*) AS total FROM market_place.processorders po
        //     LEFT JOIN market_place.orders o ON o.id = po.orderId
        //     LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        //     LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        //     LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        //     LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        //     LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        //     WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1
        //     AND (oh.city IN (?, ?) OR oa.city IN (?, ?) OR o.centerId = ? ) 
        // `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate, CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo') AS sheduleDateLocal,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish, po.outDlvrDate, CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') AS outDlvrDateLocal,
        CASE 
   
    WHEN (
        (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
        OR
        (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
        OR
        (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
    )
    THEN 'Late'


    WHEN (
        (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
        OR
        (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
        OR
        (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
    )
    THEN 'On Time'

    ELSE 'Unknown'
END AS deliveryPeriod

        FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1
        AND (
          ${deliveryLocationData && deliveryLocationData.length > 0
            ? "(oh.city IN (?) OR oa.city IN (?)) OR"
            : ""}
          o.centerId = ?
        )
        `;

        if (searchText) {
            const searchCondition = `
                AND (
                    po.invNo LIKE ?
                )
            `;
            
            dataSql += searchCondition;
            const searchValue = `%${searchText}%`;
            dataParams.push(searchValue);
        }

        if (status === 'Late' || status === 'On Time') {
            const lateOrOnTimeCondition = `
            AND (
                (
                  ? = 'Late' AND (
                    (o.sheduleTime = 'Within 8-12 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '12:00:00'))) OR
                    (o.sheduleTime = 'Within 12-4 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '16:00:00'))) OR
                    (o.sheduleTime = 'Within 4-8 PM'   AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '20:00:00')))
                  )
                )
                OR
                (
                  ? = 'On Time' AND (
                    -- Delivery date is before schedule date (early but counted as on time)
                    DATE(po.outDlvrDate) < DATE(o.sheduleDate)
                    OR
                    -- Or delivery is on the schedule date within slot
                    (
                      DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND (
                        (o.sheduleTime = 'Within 8-12 PM' AND TIME(po.outDlvrDate) <= '12:00:00') OR
                        (o.sheduleTime = 'Within 12-4 PM' AND TIME(po.outDlvrDate) <= '16:00:00') OR
                        (o.sheduleTime = 'Within 4-8 PM'  AND TIME(po.outDlvrDate) <= '20:00:00')
                      )
                    )
                  )
                )
            )
            
            `;
          
            dataSql += lateOrOnTimeCondition;
            dataParams.push(status, status);
        }

        dataSql += " ORDER BY po.outDlvrDate DESC";
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

exports.dcmSetStatusAndTimeDao = (data) => {
    console.log('data', data)
    return new Promise((resolve, reject) => {
      const { orderIds, time } = data;
  
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return reject(new Error("No orderIds provided"));
      }
  
      // SQL query to update the date
      const sql = `
        UPDATE processorders
        SET outDlvrDate = ?, status = 'Out For Delivery'
        WHERE id = ?
      `;
  
      // Use Promise.all to update all orders
      const updatePromises = orderIds.map(orderId => {
        console.log('id', orderId)
        return new Promise((res, rej) => {
            marketPlace.query(sql, [time, orderId], (err, results) => {
            if (err) return rej(err);
            res(results);
          });
        });
      });
  
      Promise.all(updatePromises)
        .then(results => resolve(results))
        .catch(err => reject(err));
    });
  };

//   exports.dcmGetOfficerTargetsDao = (managerId, deliveryLocationDataObj) => {
//     return new Promise((resolve, reject) => {
//         const { city, district } = deliveryLocationDataObj;
//         const params = [managerId, managerId, city, district, city, district];
        
//         // Combined query to get both counts and data
//         let sql = `
//         WITH package_item_counts AS (
//             SELECT 
//                 op.orderId,
//                 COUNT(*) AS totalItems,
//                 SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems
//             FROM orderpackageitems opi
//             JOIN orderpackage op ON opi.orderPackageId = op.id
//             GROUP BY op.orderId
//         ),
//         additional_items_counts AS (
//             SELECT 
//                 orderId,
//                 COUNT(*) AS totalAdditionalItems,
//                 SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems
//             FROM orderadditionalitems
//             GROUP BY orderId
//         ),
//         officer_orders AS (
//             SELECT 
//                 dti.id AS distributedTargetItemId, 
//                 dt.id AS distributedTargetId, 
//                 po.id AS processOrderId, 
//                 dti.isComplete, 
//                 dt.userId, 
//                 po.status, 
//                 po.isTargetAssigned, 
//                 po.packagePackStatus, 
//                 po.outDlvrDate, 
//                 coff.empId, 
//                 coff.firstNameEnglish, 
//                 coff.lastNameEnglish,
//                 COALESCE(pic.totalItems, 0) AS totPackageItems,
//                 COALESCE(pic.packedItems, 0) AS packPackageItems,
//                 COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
//                 COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems
                
//             FROM collection_officer.distributedtarget dt  
//             JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
//             JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
//             JOIN market_place.processorders po ON dti.orderId = po.id
//             LEFT JOIN market_place.orders o ON o.id = po.orderId
//             LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//             LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//             LEFT JOIN package_item_counts pic ON pic.orderId = po.id
//             LEFT JOIN additional_items_counts aic ON aic.orderId = po.id
//             WHERE (coff.id = ? OR coff.irmId = ?) 
//                 AND po.status IN ('Processing', 'Out For Delivery') 
//                 AND po.isTargetAssigned = 1
//                 AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         ),
//         categorized_orders AS (
//             SELECT *,
//                 CASE
//                     -- PENDING: Using exact logic from your function
//                     WHEN (
//                         -- Case 1: Both types exist, both are not started
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND packPackageItems = 0 AND COALESCE(packedAdditionalItems, 0) = 0)
//                         OR
//                         -- Case 2: Only package items exist, not started
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) = 0 
//                          AND packPackageItems = 0)
//                         OR
//                         -- Case 3: Only additional items exist, not started  
//                         (COALESCE(totPackageItems, 0) = 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND COALESCE(packedAdditionalItems, 0) = 0)
//                     ) THEN 'Pending'
                    
//                     -- COMPLETED: Using exact logic from your function
//                     WHEN (
//                         -- Case 1: Both types exist, both completed
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND packPackageItems = totPackageItems 
//                          AND COALESCE(packedAdditionalItems, 0) = COALESCE(totalAdditionalItems, 0))
//                         OR
//                         -- Case 2: Only package items exist, completed
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) = 0 
//                          AND packPackageItems = totPackageItems)
//                         OR
//                         -- Case 3: Only additional items exist, completed
//                         (COALESCE(totPackageItems, 0) = 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND COALESCE(packedAdditionalItems, 0) = COALESCE(totalAdditionalItems, 0))
//                     ) THEN 'Completed'
                    
//                     -- OPENED: Using exact logic from your function
//                     WHEN (
//                         -- Has some progress but not fully completed
//                         -- Some package items packed but not all
//                         (totPackageItems > 0 AND packPackageItems > 0 AND packPackageItems < totPackageItems)
//                         OR
//                         -- Some additional items packed but not all  
//                         (COALESCE(totalAdditionalItems, 0) > 0 AND COALESCE(packedAdditionalItems, 0) > 0 
//                          AND COALESCE(packedAdditionalItems, 0) < COALESCE(totalAdditionalItems, 0))
//                         OR
//                         -- Package items completed but additional items not started/partial
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND packPackageItems = totPackageItems 
//                          AND COALESCE(packedAdditionalItems, 0) < COALESCE(totalAdditionalItems, 0))
//                         OR
//                         -- Additional items completed but package items not started/partial  
//                         (totPackageItems > 0 AND COALESCE(totalAdditionalItems, 0) > 0 
//                          AND COALESCE(packedAdditionalItems, 0) = COALESCE(totalAdditionalItems, 0)
//                          AND packPackageItems < totPackageItems)
//                     ) THEN 'Opened'
                    
//                     ELSE 'Unknown'
//                 END AS overallStatus
//             FROM officer_orders
//         )
//         SELECT 
//             -- Get all order details
//             distributedTargetItemId,
//             distributedTargetId,
//             processOrderId,
//             isComplete,
//             userId,
//             status,
//             isTargetAssigned,
//             packagePackStatus,
//             outDlvrDate,
//             empId,
//             firstNameEnglish,
//             lastNameEnglish,
//             totPackageItems,
//             packPackageItems,
//             totalAdditionalItems,
//             packedAdditionalItems,
//             overallStatus,
            
//             -- Get counts using window functions
//             COUNT(*) OVER() as total,
//             COUNT(CASE WHEN overallStatus = 'Pending' THEN 1 END) OVER() as pending,
//             COUNT(CASE WHEN overallStatus = 'Opened' THEN 1 END) OVER() as opened,
//             COUNT(CASE WHEN overallStatus = 'Completed' THEN 1 END) OVER() as completed
            
//         FROM categorized_orders
//         ORDER BY outDlvrDate DESC
//         `;

//         console.log('Executing Officer Targets Query...');
//         marketPlace.query(sql, params, (err, results) => {
//             if (err) {
//                 console.error('Error in query:', err);
//                 return reject(err);
//             }

//             console.log('Query results:', results);

//             // Extract counts from first row (they're the same in all rows due to window functions)
//             const counts = results.length > 0 ? {
//                 total: results[0].total,
//                 pending: results[0].pending,
//                 opened: results[0].opened,
//                 completed: results[0].completed
//             } : {
//                 total: 0,
//                 pending: 0,
//                 opened: 0,
//                 completed: 0
//             };

//             // Remove the count columns from individual items
//             const items = results.map(item => {
//                 const { total, pending, opened, completed, ...cleanItem } = item;
//                 return cleanItem;
//             });

//             console.log('Final counts:', counts);
//             console.log('Items with status:', items.map(i => ({ id: i.processOrderId, status: i.overallStatus })));

//             resolve({ 
//                 items, 
//                 counts 
//             });
//         });
//     });
// };

// exports.dcmGetAllAssignOrdersDao = (packageStatus, search, deliveryLocationData, date, centerId) => {
//   console.log('fetching')
  
//   return new Promise((resolve, reject) => {

//     const params = [];

//     if (deliveryLocationData && deliveryLocationData.length > 0) {
//       params.push(deliveryLocationData, deliveryLocationData);
//     }

//     params.push(centerId);

//     let whereClause = ` 
//     WHERE 
//     po.status = 'Processing'
//     AND po.isTargetAssigned = 1 
//     AND op.packingStatus != 'Todo'
//     AND (
//       ${deliveryLocationData && deliveryLocationData.length > 0
//         ? "(oh.city IN (?) OR oa.city IN (?)) OR"
//         : ""}
//       o.centerId = ?
//     )
//      `;

   

//     if (search) {
//       whereClause += ` AND (po.invNo LIKE ?)`;
//       const searchPattern = `%${search}%`;
//       params.push(searchPattern);
//     }

//     if (date) {
//       whereClause +=  ` AND DATE(o.sheduleDate) = ? `;
//       params.push(date);
//   }

//   // if (packageStatus) {
//   //     if (packageStatus === 'Pending') {
//   //       whereClause += ` 
//   //     AND (
//   //       (pic.packedItems = 0 AND pic.totalItems > 0) 
//   //       OR 
//   //       (COALESCE(aic.packedAdditionalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0)
//   //     )
//   //   `;
//   //     } else if (packageStatus === 'Completed') {
//   //       whereClause += ` 
//   //     AND (
//   //       (pic.totalItems > 0 AND pic.packedItems = pic.totalItems) 
//   //       OR 
//   //       (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
//   //     )
//   //   `;
//   //     } else if (packageStatus === 'Opened') {
//   //       whereClause += ` 
//   //     AND (
//   //       (pic.packedItems > 0 AND pic.totalItems > pic.packedItems) 
//   //       OR 
//   //       (COALESCE(aic.packedAdditionalItems, 0) > 0 AND COALESCE(aic.totalAdditionalItems, 0) > COALESCE(aic.packedAdditionalItems, 0))
//   //     )
//   //   `;
//   //     }
//   //   }

//     if (packageStatus) {
//       if (packageStatus === 'Pending') {
//         // Truly pending: BOTH package items AND additional items have no packed items
//         // OR only one type exists and it's not started
//         whereClause += ` 
//           AND (
//             -- Case 1: Both types exist, both are not started
//             (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//              AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
//             OR
//             -- Case 2: Only package items exist, not started
//             (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
//              AND pic.packedItems = 0)
//             OR
//             -- Case 3: Only additional items exist, not started  
//             (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//              AND COALESCE(aic.packedAdditionalItems, 0) = 0)
//           )
//         `;
//       } else if (packageStatus === 'Completed') {
//         // Completed: ALL existing items (both types) are packed
//         whereClause += ` 
//           AND (
//             -- Case 1: Both types exist, both completed
//             (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//              AND pic.packedItems = pic.totalItems 
//              AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
//             OR
//             -- Case 2: Only package items exist, completed
//             (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
//              AND pic.packedItems = pic.totalItems)
//             OR
//             -- Case 3: Only additional items exist, completed
//             (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//              AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
//           )
//         `;
//       } else if (packageStatus === 'Opened') {
//         // Opened: At least one item packed, but not all items packed
//         // This means partially completed from any type
//         whereClause += ` 
//           AND (
//             -- Has some progress but not fully completed
//             (
//               -- Some package items packed but not all
//               (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
//               OR
//               -- Some additional items packed but not all  
//               (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
//                AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
//               OR
//               -- Package items completed but additional items not started/partial
//               (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//                AND pic.packedItems = pic.totalItems 
//                AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
//               OR
//               -- Additional items completed but package items not started/partial  
//               (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
//                AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
//                AND pic.packedItems < pic.totalItems)
//             )
//           )
//         `;
//       }
//   }

      

//     const dataSql = `
//     WITH package_item_counts AS (
//       SELECT 
//           op.orderId,
//           COUNT(*) AS totalItems,
//           SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
//           CASE
//               WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
//               WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
//                   AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
//               WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
//               ELSE 'Unknown'
//           END AS packageStatus
//       FROM orderpackageitems opi
//       JOIN orderpackage op ON opi.orderPackageId = op.id
//       GROUP BY op.orderId
//   ),
//   additional_items_counts AS (
//       SELECT 
//           orderId,
//           COUNT(*) AS totalAdditionalItems,
//           SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
//           CASE
//               WHEN COUNT(*) = 0 THEN 'Unknown'
//               WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
//               WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
//                    AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
//               WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
//               ELSE 'Unknown'
//           END AS additionalItemsStatus
//       FROM orderadditionalitems
//       GROUP BY orderId
//   )
        
//   SELECT 
//   o.id,
//   po.id AS processOrderId,
//   po.invNo,
//   o.sheduleDate,
//   o.sheduleTime,
//   dti.id AS distributedTargetItemId, 
//   dt.id AS distributedTargetId, 
//   dti.isComplete,
//   dt.userId,
//   coff.empId, 
//   coff.firstNameEnglish, 
//   coff.lastNameEnglish,
//   po.outDlvrDate,
//   COUNT(DISTINCT op.id) AS packageCount,
//   SUM(DISTINCT mpi.productPrice) AS packagePrice,
//   COALESCE(pic.totalItems, 0) AS totPackageItems,
//   COALESCE(pic.packedItems, 0) AS packPackageItems,
//   COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
//   COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
//   pic.packageStatus,
//   COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
// FROM collection_officer.distributedtarget dt  
// JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
// JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
// JOIN market_place.processorders po ON dti.orderId = po.id
// LEFT JOIN orders o ON po.orderId = o.id
// LEFT JOIN orderpackage op ON op.orderId = po.id 
// LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
// LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
// LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
// LEFT JOIN package_item_counts pic ON pic.orderId = po.id
// LEFT JOIN additional_items_counts aic ON aic.orderId = po.id
//       ${whereClause}
//       GROUP BY
//   o.id,
//   po.id,
//   po.invNo,
//   o.sheduleDate,
//   dti.id,
//   dt.id,
//   dti.isComplete,
//   dt.userId,
//   coff.empId,
//   coff.firstNameEnglish,
//   coff.lastNameEnglish,
//   po.outDlvrDate,
//   pic.totalItems,
//   pic.packedItems,
//   pic.packageStatus,
//   aic.totalAdditionalItems,
//   aic.packedAdditionalItems,
//   aic.additionalItemsStatus;

//       `;

  
//       console.log('Executing Data Query...');
//       marketPlace.query(dataSql, params, (dataErr, dataResults) => {
//         if (dataErr) {
//           console.error("Error in data query:", dataErr);
//           return reject(dataErr);
//         }
//         console.log('dataResults', dataResults)
//         resolve({
//           items: dataResults
//         });
//       });
//     });
// };

//   exports.dcmGetOfficerTargetsDao = (managerId, deliveryLocationDataObj) => {
//     return new Promise((resolve, reject) => {

//         const { city, district } = deliveryLocationDataObj;

//         const countParams = [managerId, managerId, city, district, city, district];
//         const dataParams = [managerId, managerId, city, district, city, district];

//         let countSql = `
//         SELECT COUNT(*) AS total
//         FROM collection_officer.distributedtarget dt  
//         JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
//         JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
//         JOIN market_place.processorders po ON dti.orderId = po.id
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         WHERE coff.id = ? OR coff.irmId = ? AND po.status IN ('Processing', 'Out For Delivery') AND po.isTargetAssigned = 1
//                 AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         `;

//         let dataSql = `
//         SELECT dti.id AS distributedTargetItemId, dt.id AS distributedTargetId, po.id AS processOrderId, dti.isComplete, dt.userId, 
// po.status, po.isTargetAssigned , po.packagePackStatus, po.outDlvrDate, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish
// FROM collection_officer.distributedtarget dt  
// JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
// JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
// JOIN market_place.processorders po ON dti.orderId = po.id
// LEFT JOIN market_place.orders o ON o.id = po.orderId
// LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
// LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
// WHERE coff.id = ? OR coff.irmId = ? AND po.status IN ('Processing', 'Out For Delivery') AND po.isTargetAssigned = 1
//         AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         `;

//         // dataSql += " ORDER BY po.outDlvrDate DESC LIMIT ? OFFSET ? ";


//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };

exports.dcmGetOfficerTargetsDao = (managerId, deliveryLocationData, centerId) => {
  return new Promise((resolve, reject) => {

    const dataParams = [managerId, managerId];

        if (deliveryLocationData && deliveryLocationData.length > 0) {
          dataParams.push(deliveryLocationData, deliveryLocationData);
        }
    
        dataParams.push(centerId);

      let dataSql = `
      WITH package_item_counts AS (
        SELECT 
            op.orderId,
            COUNT(*) AS totalItems,
            SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
            CASE
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                    AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
                ELSE 'Unknown'
            END AS packageStatus
        FROM orderpackageitems opi
        JOIN orderpackage op ON opi.orderPackageId = op.id
        GROUP BY op.orderId
    ),
    additional_items_counts AS (
        SELECT 
            orderId,
            COUNT(*) AS totalAdditionalItems,
            SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
            CASE
                WHEN COUNT(*) = 0 THEN 'Unknown'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                     AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
                ELSE 'Unknown'
            END AS additionalItemsStatus
        FROM orderadditionalitems
        GROUP BY orderId
    )
          
    SELECT 
    coff.id AS officerId,
    o.id,
    po.id AS processOrderId,
    po.invNo,
    o.sheduleDate,
    o.sheduleTime,
    dti.id AS distributedTargetItemId, 
    dt.id AS distributedTargetId, 
    dti.isComplete,
    dt.userId,
    coff.empId, 
    coff.firstNameEnglish, 
    coff.lastNameEnglish,
    po.outDlvrDate,
    COUNT(DISTINCT op.id) AS packageCount,
    SUM(DISTINCT mpi.productPrice) AS packagePrice,
    COALESCE(pic.totalItems, 0) AS totPackageItems,
    COALESCE(pic.packedItems, 0) AS packPackageItems,
    COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
    COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
    COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
    COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
  FROM collection_officer.distributedtarget dt  
  JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
  JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
  JOIN market_place.processorders po ON dti.orderId = po.id
  LEFT JOIN orders o ON po.orderId = o.id
  LEFT JOIN orderpackage op ON op.orderId = po.id 
  LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
  LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
  LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
  LEFT JOIN package_item_counts pic ON pic.orderId = po.id
  LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
        WHERE
      coff.id = ? OR coff.irmId = ? AND po.status IN ('Processing', 'Out For Delivery')
      AND po.isTargetAssigned = 1 
      AND (
        (o.isPackage = 1 AND op.packingStatus != 'Todo') 
        OR o.isPackage = 0
      )
      AND (
              ${deliveryLocationData && deliveryLocationData.length > 0
                ? "(oh.city IN (?) OR oa.city IN (?)) OR"
                : ""}
              o.centerId = ?
            )
      
        GROUP BY
    o.id,
    po.id,
    po.invNo,
    o.sheduleDate,
    dti.id,
    dt.id,
    dti.isComplete,
    dt.userId,
    coff.empId,
    coff.firstNameEnglish,
    coff.lastNameEnglish,
    po.outDlvrDate,
    pic.totalItems,
    pic.packedItems,
    pic.packageStatus,
    aic.totalAdditionalItems,
    aic.packedAdditionalItems,
    aic.additionalItemsStatus;
      `;

          marketPlace.query(dataSql, dataParams, (dataErr, dataResults) => {
              if (dataErr) {
                  console.error('Error in data query:', dataErr);
                  return reject(dataErr);
              }

              resolve({ items: dataResults });
          });
  });
};

exports.getAllOfficersDao = (userId, companyId) => {
    return new Promise((resolve, reject) => {
        const dataSql = `
        SELECT id, firstNameEnglish, lastNameEnglish, empId
        FROM collectionofficer
        WHERE companyId = ? AND (id = ? OR irmId = ?)
        `;
        
        collectionofficer.query(dataSql, [companyId, userId, userId], (err, results) => {
            if (err) {
                console.error('SQL Error:', err);
                return reject(err);
            }
            resolve(results);
            console.log('results', results)
        });
    });
};


exports.PassTargetDao = (data) => {
    return new Promise((resolve, reject) => {
        const { processOrderIds, distributedTargetId, officerId } = data;

        const queries = [
            {
                sql: `UPDATE distributedtarget SET target = target - ? WHERE id = ?`,
                params: [processOrderIds.length, distributedTargetId]
            },
            {
                sql: `INSERT INTO distributedtarget (userId, target, createdAt)
                      SELECT ?, 0, NOW()
                      WHERE NOT EXISTS (
                          SELECT 1
                          FROM distributedtarget
                          WHERE userId = ?
                            AND DATE(createdAt) = CURDATE()
                      )`,
                params: [officerId, officerId]
            },
            {
                sql: `UPDATE distributedtarget
                      SET target = target + ?
                      WHERE userId = ?
                        AND DATE(createdAt) = CURDATE()`,
                params: [processOrderIds.length, officerId]
            },
            {
                sql: `SELECT id
                      FROM distributedtarget
                      WHERE userId = ?
                        AND DATE(createdAt) = CURDATE()
                      LIMIT 1`,
                params: [officerId]
            }
        ];

        collectionofficer.getConnection((err, connection) => {
            if (err) return reject(err);

            connection.beginTransaction((err) => {
                if (err) {
                    connection.release();
                    return reject(err);
                }

                // Execute queries sequentially
                const executeQueries = async () => {
                    try {
                        const results = [];
                        for (const query of queries) {
                            const [result] = await connection.promise().query(query.sql, query.params);
                            results.push(result);
                        }
                        
                        await connection.promise().commit();
                        connection.release();
                        
                        const insertedOrExistingId = results[3] && results[3][0] ? results[3][0].id : null;
                        resolve({ results, distributedTargetId: insertedOrExistingId });
                    } catch (err) {
                        await connection.promise().rollback();
                        connection.release();
                        reject(err);
                    }
                };

                executeQueries();
            });
        });
    });
};




exports.PassTargetOrdersDao = (id, data) => {
    return new Promise((resolve, reject) => {
        const { processOrderIds } = data;

        if (!Array.isArray(processOrderIds) || processOrderIds.length === 0) {
            return reject(new Error('No processOrderIds provided'));
        }

        // Create placeholders for the IN clause based on array length
        const placeholders = processOrderIds.map(() => '?').join(',');

        const dataSql = `
            UPDATE distributedtargetitems
            SET targetId = ?
            WHERE orderId IN (${placeholders});
        `;

        // First param is targetId, then spread the orderId array
        const params = [id, ...processOrderIds];

        collectionofficer.query(dataSql, params, (err, results) => {
            if (err) {
                console.error('SQL Error:', err);
                return reject(err);
            }
            resolve(results);
            console.log('results', results);
        });
    });
};


exports.getDcmAllProducts = () => {
    return new Promise((resolve, reject) => {
        const dataSql = `
        SELECT m.id, m.displayName, CAST(m.discountedPrice AS DECIMAL(10,2)) AS discountedPrice, m.unitType  FROM market_place.marketplaceitems m 
        `;
        
        collectionofficer.query(dataSql, (err, results) => {
            if (err) {
                console.error('SQL Error:', err);
                return reject(err);
            }
            resolve(results);
            console.log('results', results)
        });
    });
};

exports.dchGetCenterTarget = (deliveryLocationData, search, packageStatus, date, companyId, centerId) => {
  console.log('fetching')

  return new Promise((resolve, reject) => {

    const params = [];

    if (deliveryLocationData && deliveryLocationData.length > 0) {
      params.push(deliveryLocationData, deliveryLocationData);
    }

    params.push(centerId);

    let whereClause = ` 
    WHERE 
    po.status IN ('Processing', 'Out For Delivery') 
    AND po.isTargetAssigned = 1 
    AND (
      (o.isPackage = 1 AND op.packingStatus != 'Todo') 
      OR o.isPackage = 0
    )
    AND (
      ${deliveryLocationData && deliveryLocationData.length > 0
        ? "(oh.city IN (?) OR oa.city IN (?)) OR"
        : ""}
      o.centerId = ?
    )
     `;

     if (date) {
      whereClause  += ` AND DATE(o.sheduleDate) = ? `;
      params.push(date);
      
  }

    if (search) {
      whereClause += ` AND (po.invNo LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
    }

    if (packageStatus) {
      if (packageStatus === 'Pending') {
        // Truly pending: BOTH package items AND additional items have no packed items
        // OR only one type exists and it's not started
        whereClause += ` 
          AND (
            -- Case 1: Both types exist, both are not started
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
            OR
            -- Case 2: Only package items exist, not started
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
             AND pic.packedItems = 0)
            OR
            -- Case 3: Only additional items exist, not started  
            (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND COALESCE(aic.packedAdditionalItems, 0) = 0)
          )
        `;
      } else if (packageStatus === 'Completed') {
        // Completed: ALL existing items (both types) are packed
        whereClause += ` 
          AND (
            -- Case 1: Both types exist, both completed
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND pic.packedItems = pic.totalItems 
             AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
            OR
            -- Case 2: Only package items exist, completed
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
             AND pic.packedItems = pic.totalItems)
            OR
            -- Case 3: Only additional items exist, completed
            (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
          )
        `;
      } else if (packageStatus === 'Opened') {
        // Opened: At least one item packed, but not all items packed
        // This means partially completed from any type
        whereClause += ` 
          AND (
            -- Has some progress but not fully completed
            (
              -- Some package items packed but not all
              (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
              OR
              -- Some additional items packed but not all  
              (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Package items completed but additional items not started/partial
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = pic.totalItems 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Additional items completed but package items not started/partial  
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
               AND pic.packedItems < pic.totalItems)
            )
          )
        `;
      }
  }


    const dataSql = `
    WITH package_item_counts AS (
      SELECT 
          op.orderId,
          COUNT(*) AS totalItems,
          SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
          CASE
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                  AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
              ELSE 'Unknown'
          END AS packageStatus
      FROM orderpackageitems opi
      JOIN orderpackage op ON opi.orderPackageId = op.id
      GROUP BY op.orderId
  ),
  additional_items_counts AS (
      SELECT 
          orderId,
          COUNT(*) AS totalAdditionalItems,
          SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
          CASE
              WHEN COUNT(*) = 0 THEN 'Unknown'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                   AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
              ELSE 'Unknown'
          END AS additionalItemsStatus
      FROM orderadditionalitems
      GROUP BY orderId
  )
        
  SELECT 
  o.id,
  po.id AS processOrderId,
  po.invNo,
  o.sheduleDate,
  o.sheduleTime,
  dti.id AS distributedTargetItemId, 
  dt.id AS distributedTargetId, 
  dti.isComplete,
  dt.userId,
  coff.empId, 
  coff.firstNameEnglish, 
  coff.lastNameEnglish,
  po.outDlvrDate,
  COUNT(DISTINCT op.id) AS packageCount,
  SUM(DISTINCT mpi.productPrice) AS packagePrice,
  COALESCE(pic.totalItems, 0) AS totPackageItems,
  COALESCE(pic.packedItems, 0) AS packPackageItems,
  COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
  COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
  COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
  COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
      ${whereClause}
      GROUP BY
  o.id,
  po.id,
  po.invNo,
  o.sheduleDate,
  dti.id,
  dt.id,
  dti.isComplete,
  dt.userId,
  coff.empId,
  coff.firstNameEnglish,
  coff.lastNameEnglish,
  po.outDlvrDate,
  pic.totalItems,
  pic.packedItems,
  pic.packageStatus,
  aic.totalAdditionalItems,
  aic.packedAdditionalItems,
  aic.additionalItemsStatus;

      `;

  
      console.log('Executing Data Query...');
      marketPlace.query(dataSql, params, (dataErr, dataResults) => {
        if (dataErr) {
          console.error("Error in data query:", dataErr);
          return reject(dataErr);
        }
        console.log('dataResults', dataResults)
        resolve({
          items: dataResults
        });
      });
    });
};

// exports.dchGetCenterTarget = (companyHeadId, searchText, status, date, companyId, centerId) => {
//     return new Promise((resolve, reject) => {
//         const countParams = [companyId, centerId];
//         const dataParams = [companyId, centerId];

//         let countSql = `
//         SELECT COUNT(*) AS total
//         FROM collection_officer.distributedtarget dt  
//         JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
//         JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
//         JOIN market_place.processorders po ON dti.orderId = po.id
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         WHERE po.status = 'Processing' AND po.isTargetAssigned = 1 AND coff.companyId = ? AND coff.distributedCenterId = ?

//         `;

//         let dataSql = `
//         SELECT dti.id AS distributedTargetItemId, dt.id AS distributedTargetId, po.id AS processOrderId, dti.isComplete, dt.userId, 
// po.status, po.isTargetAssigned , po.packagePackStatus, po.outDlvrDate, po.invNo, o.sheduleDate, o.sheduleTime, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish,
// coff.distributedCenterId, coff.companyId 
// FROM collection_officer.distributedtarget dt  
// JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
// JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
// JOIN market_place.processorders po ON dti.orderId = po.id
// LEFT JOIN market_place.orders o ON o.id = po.orderId
// LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
// LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
// WHERE po.status = 'Processing' AND po.isTargetAssigned = 1 AND coff.companyId = ? AND coff.distributedCenterId = ?
//         `;

//         if (searchText) {
//             const searchCondition = `
//                 AND (
//                     po.invNo LIKE ?
//                 )
//             `;
//             countSql += searchCondition;
//             dataSql += searchCondition;
//             const searchValue = `%${searchText}%`;
//             countParams.push(searchValue);
//             dataParams.push(searchValue);
//         }

//         if (status) {
//             countSql += ` AND po.packagePackStatus = ? `;
//             dataSql += ` AND po.packagePackStatus = ? `;
//             countParams.push(status);
//             dataParams.push(status);

//         }

//         if (date) {
//             countSql += ` AND DATE(o.sheduleDate) = ? `;
//             dataSql  += ` AND DATE(o.sheduleDate) = ? `;
//             countParams.push(date);
//             dataParams.push(date);
//         }

//         // dataSql += " ORDER BY po.outDlvrDate DESC LIMIT ? OFFSET ? ";


//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };



exports.dchGetCenterTargetOutForDelivery = (deliveryLocationData, searchText, status, date, companyId, centerId) => {
    return new Promise((resolve, reject) => {

      const countParams = [];
      const dataParams = [];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        dataParams.push(deliveryLocationData, deliveryLocationData);
        countParams.push(deliveryLocationData, deliveryLocationData);
      }
  
      dataParams.push(centerId);
      countParams.push(centerId);

      console.log('dataParams', dataParams)

        let countSql = `
            SELECT COUNT(*) AS total FROM market_place.processorders po
            LEFT JOIN market_place.orders o ON o.id = po.orderId
            LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
            LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
            LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
            LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
            LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
            WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1 
            AND (
              ${deliveryLocationData && deliveryLocationData.length > 0
                ? "(oh.city IN (?) OR oa.city IN (?)) OR"
                : ""}
              o.centerId = ?
            )
        `;

        let dataSql = `
        SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate, CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo') AS sheduleDateLocal,
        po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish, po.outDlvrDate, CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') AS outDlvrDateLocal,
        CASE 
   
    WHEN (
        (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
        OR
        (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
        OR
        (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
    )
    THEN 'Late'


    WHEN (
        (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
        OR
        (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
        OR
        (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
    )
    THEN 'On Time'

    ELSE 'Unknown'
END AS deliveryPeriod

        FROM market_place.processorders po
        LEFT JOIN market_place.orders o ON o.id = po.orderId
        LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
        LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
        LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
        LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
        LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
        WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1 
        AND (
          ${deliveryLocationData && deliveryLocationData.length > 0
            ? "(oh.city IN (?) OR oa.city IN (?)) OR"
            : ""}
          o.centerId = ?
        )
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

        if (status === 'Late' || status === 'On Time') {
            const lateOrOnTimeCondition = `
            AND (
                (
                  ? = 'Late' AND (
                    (o.sheduleTime = 'Within 8-12 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '12:00:00'))) OR
                    (o.sheduleTime = 'Within 12-4 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '16:00:00'))) OR
                    (o.sheduleTime = 'Within 4-8 PM'   AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '20:00:00')))
                  )
                )
                OR
                (
                  ? = 'On Time' AND (
                    -- Delivery date is before schedule date (early but counted as on time)
                    DATE(po.outDlvrDate) < DATE(o.sheduleDate)
                    OR
                    -- Or delivery is on the schedule date within slot
                    (
                      DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND (
                        (o.sheduleTime = 'Within 8-12 PM' AND TIME(po.outDlvrDate) <= '12:00:00') OR
                        (o.sheduleTime = 'Within 12-4 PM' AND TIME(po.outDlvrDate) <= '16:00:00') OR
                        (o.sheduleTime = 'Within 4-8 PM'  AND TIME(po.outDlvrDate) <= '20:00:00')
                      )
                    )
                  )
                )
            )
            
            `;
          
            countSql += lateOrOnTimeCondition;
            dataSql += lateOrOnTimeCondition;
          
            countParams.push(status, status);
            dataParams.push(status, status);
        }

        dataSql += " ORDER BY po.outDlvrDate DESC ";
    
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

// exports.dcmGetSelectedOfficerTargetsDao = (officerId, searchText, status, deliveryLocationDataObj) => {
//     return new Promise((resolve, reject) => {

//         const { city, district } = deliveryLocationDataObj;

//         const countParams = [officerId, city, district, city, district];
//         const dataParams = [officerId, city, district, city, district];

//         let countSql = `
//         SELECT COUNT(*) AS total
//         FROM collection_officer.distributedtarget dt  
//         JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
//         JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
//         JOIN market_place.processorders po ON dti.orderId = po.id
//         LEFT JOIN market_place.orders o ON o.id = po.orderId
//         LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
//         LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
//         WHERE coff.id = ? AND po.status IN ('Processing', 'Out For Delivery') AND po.isTargetAssigned = 1
//                 AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         `;

//         let dataSql = `
//         SELECT dti.id AS distributedTargetItemId, dt.id AS distributedTargetId, po.id AS processOrderId, dti.isComplete, dt.userId, 
// po.status, po.isTargetAssigned , po.packagePackStatus, po.outDlvrDate, po.invNo, o.sheduleDate, o.sheduleTime, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish
// FROM collection_officer.distributedtarget dt  
// JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
// JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
// JOIN market_place.processorders po ON dti.orderId = po.id
// LEFT JOIN market_place.orders o ON o.id = po.orderId
// LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
// LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
// WHERE coff.id = ? AND po.status IN ('Processing', 'Out For Delivery') AND po.isTargetAssigned = 1
//         AND (oh.city IN (?, ?) OR oa.city IN (?, ?))
//         `;

//         if (searchText) {
//             const searchCondition = `
//                 AND (
//                     po.invNo LIKE ?
//                 )
//             `;
//             countSql += searchCondition;
//             dataSql += searchCondition;
//             const searchValue = `%${searchText}%`;
//             countParams.push(searchValue);
//             dataParams.push(searchValue);
//         }

//         if (status) {
//             countSql += ` AND po.packagePackStatus = ? `;
//             dataSql += ` AND po.packagePackStatus = ? `;
//             countParams.push(status);
//             dataParams.push(status);

//         }

//         // dataSql += " ORDER BY po.outDlvrDate DESC LIMIT ? OFFSET ? ";


//         collectionofficer.query(countSql, countParams, (countErr, countResults) => {
//             if (countErr) {
//                 console.error('Error in count query:', countErr);
//                 return reject(countErr);
//             }

//             const total = countResults[0].total;

//             // Execute data query
//             collectionofficer.query(dataSql, dataParams, (dataErr, dataResults) => {
//                 if (dataErr) {
//                     console.error('Error in data query:', dataErr);
//                     return reject(dataErr);
//                 }

//                 resolve({ items: dataResults, total });
//             });
//         });
//     });
// };


// exports.dcmGetSelectedOfficerTargetsDao = (deliveryLocationDataObj) => {
//       console.log('hdshf', deliveryLocationDataObj)
// }

 // if (packageStatus) {
      //   if (packageStatus === 'Pending') {
      //     whereClause += ` 
      //   AND (
      //     (pc.packedItems = 0 AND pc.totalItems > 0) 
      //     OR 
      //     (COALESCE(aic.packedAdditionalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0)
      //   )
      // `;
      //   } else if (packageStatus === 'Completed') {
      //     whereClause += ` 
      //   AND (
      //     (pc.totalItems > 0 AND pc.packedItems = pc.totalItems) 
      //     OR 
      //     (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
      //   )
      // `;
      //   } else if (packageStatus === 'Opened') {
      //     whereClause += ` 
      //   AND (
      //     (pc.packedItems > 0 AND pc.totalItems > pc.packedItems) 
      //     OR 
      //     (COALESCE(aic.packedAdditionalItems, 0) > 0 AND COALESCE(aic.totalAdditionalItems, 0) > COALESCE(aic.packedAdditionalItems, 0))
      //   )
      // `;
      //   }
      // }
  
      // if (date) {
      //   whereClause += " AND DATE(o.sheduleDate) = ?";
      //   params.push(date);
      //   countParams.push(date);
      // }

exports.dcmGetSelectedOfficerTargetsDao = (officerId, deliveryLocationData, search, packageStatus, centerId ) => {
    console.log('fetching')
    return new Promise((resolve, reject) => {

      const params = [officerId];

      if (deliveryLocationData && deliveryLocationData.length > 0) {
        params.push(deliveryLocationData, deliveryLocationData);
      }
  
      params.push(centerId);
  
      let whereClause = ` 
      WHERE 
      coff.id = ? 
      AND po.status IN ('Processing', 'Out For Delivery') 
      AND po.isTargetAssigned = 1 
      AND (
        (o.isPackage = 1 AND op.packingStatus != 'Todo') 
        OR o.isPackage = 0
      )
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
       `;
  
     
  
      if (search) {
        whereClause += ` AND (po.invNo LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern);
        
      }

      if (packageStatus) {
          if (packageStatus === 'Pending') {
            whereClause += ` 
          AND (
            (pic.packedItems = 0 AND pic.totalItems > 0) 
            OR 
            (COALESCE(aic.packedAdditionalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0)
          )
        `;
          } else if (packageStatus === 'Completed') {
            whereClause += ` 
          AND (
            (pic.totalItems > 0 AND pic.packedItems = pic.totalItems) 
            OR 
            (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
          )
        `;
          } else if (packageStatus === 'Opened') {
            whereClause += ` 
          AND (
            (pic.packedItems > 0 AND pic.totalItems > pic.packedItems) 
            OR 
            (COALESCE(aic.packedAdditionalItems, 0) > 0 AND COALESCE(aic.totalAdditionalItems, 0) > COALESCE(aic.packedAdditionalItems, 0))
          )
        `;
          }
        }
  
      const dataSql = `
      WITH package_item_counts AS (
        SELECT 
            op.orderId,
            COUNT(*) AS totalItems,
            SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
            CASE
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                    AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
                ELSE 'Unknown'
            END AS packageStatus
        FROM orderpackageitems opi
        JOIN orderpackage op ON opi.orderPackageId = op.id
        GROUP BY op.orderId
    ),
    additional_items_counts AS (
        SELECT 
            orderId,
            COUNT(*) AS totalAdditionalItems,
            SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
            CASE
                WHEN COUNT(*) = 0 THEN 'Unknown'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                     AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
                WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
                ELSE 'Unknown'
            END AS additionalItemsStatus
        FROM orderadditionalitems
        GROUP BY orderId
    )
          
    SELECT 
    o.id,
    po.id AS processOrderId,
    po.invNo,
    o.sheduleDate,
    o.sheduleTime,
    dti.id AS distributedTargetItemId, 
    dti.completeTime,
    dt.id AS distributedTargetId, 
    dti.isComplete,
    dt.userId,
    coff.empId, 
    coff.firstNameEnglish, 
    coff.lastNameEnglish,
    po.outDlvrDate,
    COUNT(DISTINCT op.id) AS packageCount,
    SUM(DISTINCT mpi.productPrice) AS packagePrice,
    COALESCE(pic.totalItems, 0) AS totPackageItems,
    COALESCE(pic.packedItems, 0) AS packPackageItems,
    COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
    COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
    COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
    COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
        ${whereClause}
        GROUP BY
    o.id,
    po.id,
    po.invNo,
    o.sheduleDate,
    dti.id,
    dt.id,
    dti.isComplete,
    dt.userId,
    coff.empId,
    coff.firstNameEnglish,
    coff.lastNameEnglish,
    po.outDlvrDate,
    pic.totalItems,
    pic.packedItems,
    pic.packageStatus,
    aic.totalAdditionalItems,
    aic.packedAdditionalItems,
    aic.additionalItemsStatus;

        `;
  
    
        console.log('Executing Data Query...');
        marketPlace.query(dataSql, params, (dataErr, dataResults) => {
          if (dataErr) {
            console.error("Error in data query:", dataErr);
            return reject(dataErr);
          }
          console.log('dataResults', dataResults)
          resolve({
            items: dataResults
          });
        });
      });
  };

  exports.getPrevDefineProduct = (replaceId) => {
    return new Promise((resolve, reject) => {
      const sql = `
      SELECT pdp.productId, pdp.price, pdp.productType, pdp.qty, mpi.discountedPrice, mpi.displayName, pt.typeName, pt.shortCode FROM market_place.prevdefineproduct pdp
      LEFT JOIN marketplaceitems mpi ON pdp.productId = mpi.id
      LEFT JOIN market_place.producttypes pt ON pdp.productType = pt.id 
      `;
      marketPlace.query(sql, [replaceId], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results[0] || null);
      });
    });
  };

  exports.generateRegCode = (province, district, city, callback) => {
    // Generate the prefix based on province and district
    const prefix =
      'D' + province.slice(0, 2).toUpperCase() +
      district.slice(0, 1).toUpperCase() +
      city.slice(0, 1).toUpperCase();
  
    // SQL query to get the latest regCode
    const query = `SELECT regCode FROM distributedcenter WHERE regCode LIKE ? ORDER BY regCode DESC LIMIT 1`;
  
    // Execute the query
    collectionofficer.execute(query, [`${prefix}-%`], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return callback(err);
      }
  
      let newRegCode = `${prefix}-01`; // Default to 01 if no regCode found
  
      if (results.length > 0) {
        // Get the last regCode and extract the number
        const lastRegCode = results[0].regCode;
        const lastNumber = parseInt(lastRegCode.split("-")[1]);
        const newNumber = lastNumber + 1;
        newRegCode = `${prefix}-${String(newNumber).padStart(2, "0")}`;
      }
  
      // Return the new regCode
      callback(null, newRegCode);
    });
  };

  exports.checkExistEmailsDao = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM distributedcenter
            WHERE email = ?
        `;

        collectionofficer.query(sql, [email], (err, results) => {
            if (err) {
                return reject(err);
            }
            let validationResult = false;
            if (results.length > 0) {
                validationResult = true;
            }
            resolve(validationResult);
        });
    });
};

exports.checkExistPhoneDao = (phone1) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM distributedcenter
            WHERE contact01 = ? OR contact02 = ?
        `;

        collectionofficer.query(sql, [phone1, phone1], (err, results) => {
            if (err) {
                return reject(err);
            }
            let validationResult = false;
            if (results.length > 0) {
                validationResult = true;
            }
            resolve(validationResult);
        });
    });
};

exports.checkExistPhone2Dao = (phone2) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM distributedcenter
            WHERE contact01 = ? OR contact02 = ?
        `;

        collectionofficer.query(sql, [phone2, phone2], (err, results) => {
            if (err) {
                return reject(err);
            }
            const validationResult = results.length > 0;
            resolve(validationResult);
        });
    });
};


exports.downloadAllTargetProgressDao = (packageStatus, search, deliveryLocationData, date, centerId) => {
  console.log('fetching')
  
  return new Promise((resolve, reject) => {

    const params = [];

    if (deliveryLocationData && deliveryLocationData.length > 0) {
      params.push(deliveryLocationData, deliveryLocationData);
    }

    params.push(centerId);

    let whereClause = ` 
    WHERE 
    po.status = 'Processing'
    AND po.isTargetAssigned = 1 
    AND (
      (o.isPackage = 1 AND op.packingStatus != 'Todo') 
      OR o.isPackage = 0
    )
    AND (
      ${deliveryLocationData && deliveryLocationData.length > 0
        ? "(oh.city IN (?) OR oa.city IN (?)) OR"
        : ""}
      o.centerId = ?
    )
     `;

   

    if (search) {
      whereClause += ` AND (po.invNo LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
    }

    if (date) {
      whereClause +=  ` AND DATE(o.sheduleDate) = ? `;
      params.push(date);
  }

  // if (packageStatus) {
  //     if (packageStatus === 'Pending') {
  //       whereClause += ` 
  //     AND (
  //       (pic.packedItems = 0 AND pic.totalItems > 0) 
  //       OR 
  //       (COALESCE(aic.packedAdditionalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0)
  //     )
  //   `;
  //     } else if (packageStatus === 'Completed') {
  //       whereClause += ` 
  //     AND (
  //       (pic.totalItems > 0 AND pic.packedItems = pic.totalItems) 
  //       OR 
  //       (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
  //     )
  //   `;
  //     } else if (packageStatus === 'Opened') {
  //       whereClause += ` 
  //     AND (
  //       (pic.packedItems > 0 AND pic.totalItems > pic.packedItems) 
  //       OR 
  //       (COALESCE(aic.packedAdditionalItems, 0) > 0 AND COALESCE(aic.totalAdditionalItems, 0) > COALESCE(aic.packedAdditionalItems, 0))
  //     )
  //   `;
  //     }
  //   }

    if (packageStatus) {
      if (packageStatus === 'Pending') {
        // Truly pending: BOTH package items AND additional items have no packed items
        // OR only one type exists and it's not started
        whereClause += ` 
          AND (
            -- Case 1: Both types exist, both are not started
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND pic.packedItems = 0 AND COALESCE(aic.packedAdditionalItems, 0) = 0)
            OR
            -- Case 2: Only package items exist, not started
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
             AND pic.packedItems = 0)
            OR
            -- Case 3: Only additional items exist, not started  
            (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND COALESCE(aic.packedAdditionalItems, 0) = 0)
          )
        `;
      } else if (packageStatus === 'Completed') {
        // Completed: ALL existing items (both types) are packed
        whereClause += ` 
          AND (
            -- Case 1: Both types exist, both completed
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND pic.packedItems = pic.totalItems 
             AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
            OR
            -- Case 2: Only package items exist, completed
            (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) = 0 
             AND pic.packedItems = pic.totalItems)
            OR
            -- Case 3: Only additional items exist, completed
            (COALESCE(pic.totalItems, 0) = 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
             AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0))
          )
        `;
      } else if (packageStatus === 'Opened') {
        // Opened: At least one item packed, but not all items packed
        // This means partially completed from any type
        whereClause += ` 
          AND (
            -- Has some progress but not fully completed
            (
              -- Some package items packed but not all
              (pic.totalItems > 0 AND pic.packedItems > 0 AND pic.packedItems < pic.totalItems)
              OR
              -- Some additional items packed but not all  
              (COALESCE(aic.totalAdditionalItems, 0) > 0 AND COALESCE(aic.packedAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Package items completed but additional items not started/partial
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND pic.packedItems = pic.totalItems 
               AND COALESCE(aic.packedAdditionalItems, 0) < COALESCE(aic.totalAdditionalItems, 0))
              OR
              -- Additional items completed but package items not started/partial  
              (pic.totalItems > 0 AND COALESCE(aic.totalAdditionalItems, 0) > 0 
               AND COALESCE(aic.packedAdditionalItems, 0) = COALESCE(aic.totalAdditionalItems, 0)
               AND pic.packedItems < pic.totalItems)
            )
          )
        `;
      }
  }

      

    const dataSql = `
    WITH package_item_counts AS (
      SELECT 
          op.orderId,
          COUNT(*) AS totalItems,
          SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) AS packedItems,
          CASE
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = 0 AND COUNT(*) > 0 THEN 'Pending'
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) > 0 
                  AND SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
              WHEN SUM(CASE WHEN opi.isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) AND COUNT(*) > 0 THEN 'Completed'
              ELSE 'Unknown'
          END AS packageStatus
      FROM orderpackageitems opi
      JOIN orderpackage op ON opi.orderPackageId = op.id
      GROUP BY op.orderId
  ),
  additional_items_counts AS (
      SELECT 
          orderId,
          COUNT(*) AS totalAdditionalItems,
          SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) AS packedAdditionalItems,
          CASE
              WHEN COUNT(*) = 0 THEN 'Unknown'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = 0 THEN 'Pending'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) > 0 
                   AND SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) < COUNT(*) THEN 'Opened'
              WHEN SUM(CASE WHEN isPacked = 1 THEN 1 ELSE 0 END) = COUNT(*) THEN 'Completed'
              ELSE 'Unknown'
          END AS additionalItemsStatus
      FROM orderadditionalitems
      GROUP BY orderId
  )
        
  SELECT 
  o.id,
  po.id AS processOrderId,
  po.invNo,
  o.sheduleDate,
  o.sheduleTime,
  dti.id AS distributedTargetItemId, 
  dt.id AS distributedTargetId, 
  dti.isComplete,
  dt.userId,
  coff.empId, 
  coff.firstNameEnglish, 
  coff.lastNameEnglish,
  po.outDlvrDate,
  COUNT(DISTINCT op.id) AS packageCount,
  SUM(DISTINCT mpi.productPrice) AS packagePrice,
  COALESCE(pic.totalItems, 0) AS totPackageItems,
  COALESCE(pic.packedItems, 0) AS packPackageItems,
  COALESCE(aic.totalAdditionalItems, 0) AS totalAdditionalItems,
  COALESCE(aic.packedAdditionalItems, 0) AS packedAdditionalItems,
  COALESCE(pic.packageStatus, 'Unknown') AS packageStatus,
  COALESCE(aic.additionalItemsStatus, 'Unknown') AS additionalItemsStatus
FROM collection_officer.distributedtarget dt  
JOIN collection_officer.distributedtargetitems dti ON dti.targetId = dt.id
JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id
JOIN market_place.processorders po ON dti.orderId = po.id
LEFT JOIN orders o ON po.orderId = o.id
LEFT JOIN orderpackage op ON op.orderId = po.id 
LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
LEFT JOIN marketplacepackages mpi ON op.packageId = mpi.id
LEFT JOIN package_item_counts pic ON pic.orderId = po.id
LEFT JOIN additional_items_counts aic ON aic.orderId = o.id
      ${whereClause}
      GROUP BY
  o.id,
  po.id,
  po.invNo,
  o.sheduleDate,
  dti.id,
  dt.id,
  dti.isComplete,
  dt.userId,
  coff.empId,
  coff.firstNameEnglish,
  coff.lastNameEnglish,
  po.outDlvrDate,
  pic.totalItems,
  pic.packedItems,
  pic.packageStatus,
  aic.totalAdditionalItems,
  aic.packedAdditionalItems,
  aic.additionalItemsStatus;

      `;

  
      console.log('Executing Data Query...');
      marketPlace.query(dataSql, params, (dataErr, dataResults) => {
        if (dataErr) {
          console.error("Error in data query:", dataErr);
          return reject(dataErr);
        }
        console.log('dataResults', dataResults)
        resolve({
          dataResults
        });
      });
    });
};


exports.dcmGetOutForDeliveryTargetProgressReportDao = (status, searchText, deliveryLocationData, centerId) => {
  return new Promise((resolve, reject) => {


    const dataParams = [];

    if (deliveryLocationData && deliveryLocationData.length > 0) {
      dataParams.push(deliveryLocationData, deliveryLocationData);
    }

    dataParams.push(centerId);

      // let countSql = `
      //     SELECT COUNT(*) AS total FROM market_place.processorders po
      //     LEFT JOIN market_place.orders o ON o.id = po.orderId
      //     LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
      //     LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
      //     LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
      //     LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
      //     LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
      //     WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1
      //     AND (oh.city IN (?, ?) OR oa.city IN (?, ?) OR o.centerId = ? ) 
      // `;

      let dataSql = `
      SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate, CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo') AS sheduleDateLocal,
      po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish, po.outDlvrDate, CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') AS outDlvrDateLocal,
      CASE 
 
  WHEN (
      (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
      OR
      (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
      OR
      (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
  )
  THEN 'Late'


  WHEN (
      (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
      OR
      (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
      OR
      (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
  )
  THEN 'On Time'

  ELSE 'Unknown'
END AS deliveryPeriod

      FROM market_place.processorders po
      LEFT JOIN market_place.orders o ON o.id = po.orderId
      LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
      LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
      LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
      LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
      LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
      WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
      `;

      if (searchText) {
          const searchCondition = `
              AND (
                  po.invNo LIKE ?
              )
          `;
          
          dataSql += searchCondition;
          const searchValue = `%${searchText}%`;
          dataParams.push(searchValue);
      }

      if (status === 'Late' || status === 'On Time') {
          const lateOrOnTimeCondition = `
          AND (
              (
                ? = 'Late' AND (
                  (o.sheduleTime = 'Within 8-12 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '12:00:00'))) OR
                  (o.sheduleTime = 'Within 12-4 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '16:00:00'))) OR
                  (o.sheduleTime = 'Within 4-8 PM'   AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '20:00:00')))
                )
              )
              OR
              (
                ? = 'On Time' AND (
                  -- Delivery date is before schedule date (early but counted as on time)
                  DATE(po.outDlvrDate) < DATE(o.sheduleDate)
                  OR
                  -- Or delivery is on the schedule date within slot
                  (
                    DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND (
                      (o.sheduleTime = 'Within 8-12 PM' AND TIME(po.outDlvrDate) <= '12:00:00') OR
                      (o.sheduleTime = 'Within 12-4 PM' AND TIME(po.outDlvrDate) <= '16:00:00') OR
                      (o.sheduleTime = 'Within 4-8 PM'  AND TIME(po.outDlvrDate) <= '20:00:00')
                    )
                  )
                )
              )
          )
          
          `;
        
          dataSql += lateOrOnTimeCondition;
          dataParams.push(status, status);
      }

      dataSql += " ORDER BY po.outDlvrDate DESC";
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


exports.dchGetCenterTargetOutForDeliveryReport = (deliveryLocationData, searchText, status, date, companyId, centerId) => {
  return new Promise((resolve, reject) => {

    const countParams = [];
    const dataParams = [];

    if (deliveryLocationData && deliveryLocationData.length > 0) {
      dataParams.push(deliveryLocationData, deliveryLocationData);
      countParams.push(deliveryLocationData, deliveryLocationData);
    }

    dataParams.push(centerId);
    countParams.push(centerId);

    console.log('dataParams', dataParams)

      let countSql = `
          SELECT COUNT(*) AS total FROM market_place.processorders po
          LEFT JOIN market_place.orders o ON o.id = po.orderId
          LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
          LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
          LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
          LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
          LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
          WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1 
          AND (
            ${deliveryLocationData && deliveryLocationData.length > 0
              ? "(oh.city IN (?) OR oa.city IN (?)) OR"
              : ""}
            o.centerId = ?
          )
      `;

      let dataSql = `
      SELECT po.id AS processOrderId, o.id AS orderId, po.invNo, po.status, po.isTargetAssigned, o.delivaryMethod, o.sheduleTime, o.sheduleDate, CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo') AS sheduleDateLocal,
      po.packagePackStatus, coff.id AS officerId, coff.empId, coff.firstNameEnglish, coff.lastNameEnglish, po.outDlvrDate, CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') AS outDlvrDateLocal,
      CASE 
 
  WHEN (
      (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
      OR
      (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
      OR
      (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') > TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
  )
  THEN 'Late'


  WHEN (
      (o.sheduleTime = 'Within 8-12 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '12:00:00'))
      OR
      (o.sheduleTime = 'Within 12-4 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '16:00:00'))
      OR
      (o.sheduleTime = 'Within 4-8 PM' AND CONVERT_TZ(po.outDlvrDate, 'UTC', 'Asia/Colombo') <= TIMESTAMP(DATE(CONVERT_TZ(o.sheduleDate, 'UTC', 'Asia/Colombo')), '20:00:00'))
  )
  THEN 'On Time'

  ELSE 'Unknown'
END AS deliveryPeriod

      FROM market_place.processorders po
      LEFT JOIN market_place.orders o ON o.id = po.orderId
      LEFT JOIN market_place.orderhouse oh ON oh.orderId = o.id
      LEFT JOIN market_place.orderapartment oa ON oa.orderId = o.id
      LEFT JOIN collection_officer.distributedtargetitems dti ON dti.orderId = po.id
      LEFT JOIN collection_officer.distributedtarget dt ON dti.targetId = dt.id
      LEFT JOIN collection_officer.collectionofficer coff ON dt.userId = coff.id 
      WHERE po.status = 'Out For Delivery' AND po.isTargetAssigned = 1 
      AND (
        ${deliveryLocationData && deliveryLocationData.length > 0
          ? "(oh.city IN (?) OR oa.city IN (?)) OR"
          : ""}
        o.centerId = ?
      )
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

      if (status === 'Late' || status === 'On Time') {
          const lateOrOnTimeCondition = `
          AND (
              (
                ? = 'Late' AND (
                  (o.sheduleTime = 'Within 8-12 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '12:00:00'))) OR
                  (o.sheduleTime = 'Within 12-4 PM'  AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '16:00:00'))) OR
                  (o.sheduleTime = 'Within 4-8 PM'   AND (DATE(po.outDlvrDate) > DATE(o.sheduleDate) OR (DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND TIME(po.outDlvrDate) > '20:00:00')))
                )
              )
              OR
              (
                ? = 'On Time' AND (
                  -- Delivery date is before schedule date (early but counted as on time)
                  DATE(po.outDlvrDate) < DATE(o.sheduleDate)
                  OR
                  -- Or delivery is on the schedule date within slot
                  (
                    DATE(po.outDlvrDate) = DATE(o.sheduleDate) AND (
                      (o.sheduleTime = 'Within 8-12 PM' AND TIME(po.outDlvrDate) <= '12:00:00') OR
                      (o.sheduleTime = 'Within 12-4 PM' AND TIME(po.outDlvrDate) <= '16:00:00') OR
                      (o.sheduleTime = 'Within 4-8 PM'  AND TIME(po.outDlvrDate) <= '20:00:00')
                    )
                  )
                )
              )
          )
          
          `;
        
          countSql += lateOrOnTimeCondition;
          dataSql += lateOrOnTimeCondition;
        
          countParams.push(status, status);
          dataParams.push(status, status);
      }

      dataSql += " ORDER BY po.outDlvrDate DESC ";
  
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



  

