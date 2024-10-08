const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Fetch product by ID
exports.getProductById = async (req, res) => {
    const productId = req.params.id;

    try {
        const query = `
         SELECT 
                sa.saree_name, sa.saree_weight, sa.blouse_type_id, 
                c.color_name, ft.fabric_type_name, sa.weave_types, sl.saree_length, 
                ot.occasion_name, co.country_of_origin, 
                ic.components_description, 
                i.price, 
                img.main_image_url, img.image_url1, img.image_url2, img.image_url3, img.image_url4  
                FROM items i
                inner JOIN saree_attributes sa ON sa.id = i.sarees_id
				inner JOIN colors c ON c.id = sa.color_id
                inner JOIN fabric_types ft ON ft.id = sa.fabric_type_id
                inner JOIN saree_lengths sl ON sl.id = sa.saree_length_id
                inner JOIN occasion_types ot ON ot.id = sa.occasion_id
                inner JOIN countries co ON co.id = sa.country_id
                inner JOIN included_components ic ON ic.id = sa.included_components_id
                inner JOIN image_sets img ON img.saree_id = sa.id
                WHERE 1=1;
;`

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
                sa.saree_name, sa.saree_weight, sa.blouse_type_id, 
                c.color_name, ft.fabric_type_name, sa.weave_types, sl.saree_length, 
                ot.occasion_name, co.country_of_origin, 
                ic.components_description, 
                i.price, 
                img.main_image_url, img.image_url1, img.image_url2, img.image_url3, img.image_url4  
                FROM items i
                inner JOIN saree_attributes sa ON sa.id = i.sarees_id
				inner JOIN colors c ON c.id = sa.color_id
                inner JOIN fabric_types ft ON ft.id = sa.fabric_type_id
                inner JOIN saree_lengths sl ON sl.id = sa.saree_length_id
                inner JOIN occasion_types ot ON ot.id = sa.occasion_id
                inner JOIN countries co ON co.id = sa.country_id
                inner JOIN included_components ic ON ic.id = sa.included_components_id
                inner JOIN image_sets img ON img.saree_id = sa.id
                WHERE 1=1;
`;

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
            query += ` AND wt.weave_type_name = ?`;
            queryParams.push(weaveType);
        }

        // Sorting
        if (sortBy === 'price_asc') {
            query += ` ORDER BY i.price ASC`;
        } else if (sortBy === 'price_desc') {
            query += ` ORDER BY i.price DESC`;
        }

        // Pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));

        db.query(query, queryParams, (err, results) => {
            if (err) {
                return res.status(500).json(new ApiError(500, `Internal server error: ${err.message}`));
            }
            if (results.length === 0) {
                return res.status(404).json(new ApiError(404, `No products found`));
            }
            return res.status(200).json(
                new ApiResponse(200, results, 'List of products retrieved successfully')
            );
        });
    } catch (error) {
        return res.status(500).json(new ApiError(500, `Error fetching product list: ${error.message}`));
    }
};
