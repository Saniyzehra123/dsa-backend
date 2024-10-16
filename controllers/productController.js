const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Fetch product by ID
exports.getProductById = async (req, res) => {
    const productId = req.params.id;

    try {
        const query = `SELECT 
                        i.id AS item_id, 
                        i.sarees_id,
                        sa.saree_name, 
                        sa.saree_weight, 
                        sa.blouse_type_id, 
                        c.color_name, 
                        ft.fabric_type_name, 
                        sa.weave_types, 
                        sl.saree_length, 
                        ot.occasion_name, 
                        co.country_of_origin, 
                        ic.components_description, 
                        i.price, 
                        sa.main_image_url, 
                        sa.image_url1, 
                        sa.image_url2, 
                        sa.image_url3, 
                        sa.image_url4,
                        CASE 
                            WHEN sa.blouse_type_id IS NOT NULL THEN b.blouse_description
                            ELSE null
                        END AS blouse_name,
                        CASE 
                            WHEN sa.weave_types IS NOT NULL THEN w.weave_type_name
                            ELSE null
                        END AS weave_name
                    FROM saree_attributes sa
                    INNER JOIN items i ON i.sarees_id = sa.id
                    INNER JOIN colors c ON c.id = sa.color_id
                    INNER JOIN fabric_types ft ON ft.id = sa.fabric_type_id
                    INNER JOIN saree_lengths sl ON sl.id = sa.saree_length_id
                    INNER JOIN occasion_types ot ON ot.id = sa.occasion_id
                    INNER JOIN countries co ON co.id = sa.country_id
                    INNER JOIN included_components ic ON ic.id = sa.included_components_id
                    LEFT JOIN  blouse_types b ON b.id = sa.blouse_type_id
                    LEFT JOIN  weave_types w ON w.id = sa.weave_types 
                    WHERE i.id = ?`;

        db.query(query, [productId], (err, results) => {
            if (err) {
                return res.status(500).json(new ApiError(500, `Internal server error: ${err.message}`));
            }
            if (results.length === 0) {
                return res.status(404).json(new ApiError(404, `Product with ID ${productId} not found`));
            }
            return res.status(200).json(
                new ApiResponse(200, results[0], 'Product details retrieved successfully')
            );
        });
    } catch (error) {
        return res.status(500).json(new ApiError(500, `Error fetching product details: ${error.message}`));
    }
};

// Get all products with images, filters, and pagination
exports.getAllProducts = async (req, res) => {
    const { color, minPrice, maxPrice, fabricType, occasion, weaveType, sortBy, page = 1, limit = 10 } = req.query;

    try {
        let query = `
           SELECT 
                i.id as item_id, i.sarees_id, sa.saree_name, sa.saree_weight, sa.blouse_type_id, 
               c.color_name, ft.fabric_type_name, sa.weave_types, sl.saree_length, 
               ot.occasion_name, co.country_of_origin, 
               ic.components_description, 
               i.price, 
               sa.main_image_url, sa.image_url1, sa.image_url2, sa.image_url3, sa.image_url4  
               FROM saree_attributes sa
               INNER JOIN items i ON i.sarees_id = sa.id
               INNER JOIN colors c ON c.id = sa.color_id
               INNER JOIN fabric_types ft ON ft.id = sa.fabric_type_id
               INNER JOIN saree_lengths sl ON sl.id = sa.saree_length_id
               INNER JOIN occasion_types ot ON ot.id = sa.occasion_id
               INNER JOIN countries co ON co.id = sa.country_id
               INNER JOIN included_components ic ON ic.id = sa.included_components_id
               WHERE 1=1`;  // Using 'WHERE 1=1' for easier addition of filters

        let queryParams = [];

        // Apply filters
        if (color) {
            query += ` AND c.color_name LIKE ?`;
            queryParams.push(`%${color}%`);
        }
        if (minPrice) {
            query += ` AND i.price >= ?`;
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            query += ` AND i.price <= ?`;
            queryParams.push(maxPrice);
        }
        if (fabricType) {
            query += ` AND ft.fabric_type_name = ?`;
            queryParams.push(fabricType);
        }
        if (occasion) {
            query += ` AND ot.occasion_name = ?`;
            queryParams.push(occasion);
        }
        if (weaveType) {
            query += ` AND sa.weave_types = ?`;
            queryParams.push(weaveType);
        }

        // Sorting
        if (sortBy === 'price_asc') {
            query += ` ORDER BY i.price ASC`;
        } else if (sortBy === 'price_desc') {
            query += ` ORDER BY i.price DESC`;
        }

        // Pagination (ensure limit and offset are integers)
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        console.log("Tested Params:", queryParams);

        db.query(query, queryParams, (err, results) => {
            if (err) {
                console.error("Error executing query:", err.message);
                return res.status(500).json({ message: `Internal server error: ${err.message}` });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'No products found' });
            }
            return res.status(200).json({
                message: 'List of products retrieved successfully',
                data: results
            });
        });
    } catch (error) {
        console.error("Error in catch block:", error.message);
        return res.status(500).json({ message: `Error fetching product list: ${error.message}` });
    }
};

