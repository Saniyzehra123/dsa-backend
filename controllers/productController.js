const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');

// Fetch product by ID
exports.getProductById = async (req, res) => {
    const productId = req.params.id;

    try {
        const query = `SELECT 
		i.id AS item_id, 
		c.color_name, 
		ft.fabric_type_name, 
		ot.occasion_name, 
		co.country_of_origin,
		i.price,
        w.weave_type_name as weave_name,
        b.blouse_description as blouse_name,
        ot.occasion_name,
        i.discount,
        i.new_arrival,
        i.des,
        i.rating,
        i.stock_quantity,
        i.code_id,
        i.image_url1,
        i.image_url2
	from items i
	left JOIN colors c ON c.id = i.color_id
	left JOIN fabric_types ft ON ft.id = i.fabric_type_id
	left JOIN saree_lengths sl ON sl.id = i.size_id
	left JOIN occasion_types ot ON ot.id = i.occasion_id
	left JOIN countries co ON co.id = i.country_id
	LEFT JOIN  blouse_types b ON b.id = i.blouse_type_id
	LEFT JOIN  weave_types w ON w.id = i.weave_types 
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
        let query = `SELECT 
		i.id AS item_id, 
		c.color_name, 
		ft.fabric_type_name, 
		ot.occasion_name, 
		co.country_of_origin,
		i.price,
        w.weave_type_name as weave_name,
        b.blouse_description as blouse_name,
        ot.occasion_name,
        i.discount,
        i.new_arrival,
        i.des,
        i.rating,
        i.stock_quantity,
        i.code_id,
        i.image_url1,
        i.image_url2
	from items i
	left JOIN colors c ON c.id = i.color_id
	left JOIN fabric_types ft ON ft.id = i.fabric_type_id
	left JOIN saree_lengths sl ON sl.id = i.size_id
	left JOIN occasion_types ot ON ot.id = i.occasion_id
	left JOIN countries co ON co.id = i.country_id
	LEFT JOIN  blouse_types b ON b.id = i.blouse_type_id
	LEFT JOIN  weave_types w ON w.id = i.weave_types 
	WHERE 1 = 1`;

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

