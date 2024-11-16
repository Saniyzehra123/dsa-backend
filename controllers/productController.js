const db = require('../config/db.js');
const ApiError = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');
const {uploadOnCloudinary } = require("../utils/ApiError.js");

// Fetch product by ID
exports.getProductById = async (req, res) => {
    const productId = req.params.id;

    try {
        let query = `SELECT 
            i.id AS item_id,
            ft.fabric_type_name, 
            co.country_of_origin,
            i.price,
            w.weave_type_name as weave_name,
            ot.occasion_name,
            i.discount,
            i.new_arrival,
            i.des,
            i.rating,
            i.stock_quantity,
            i.code_name,
            i.image_url1,
            i.image_url2,
            i.image_url3,
            i.image_url4,
            i.image_url5,
            i.image_url6,
            i.main_image_url,
            c.color_name,
            c.color_des,
            c.color_code,
            i.title,
            i.new_arrival,
            s.size,
            st.saree_name,
            i.weight,
            i.stock_quantity,
            i.included_components,
            i.boluse_des
        FROM items i
        LEFT JOIN colors c ON c.id = i.color_id
        LEFT JOIN fabric_types ft ON ft.id = i.fabric_type_id
        LEFT JOIN size s ON s.id = i.size_id
        LEFT JOIN occasion_types ot ON ot.id = i.occasion_id
        LEFT JOIN countries co ON co.id = i.country_id
        LEFT JOIN weave_types w ON w.id = i.weave_type_id 
        LEFT JOIN saree_types st ON st.id = i.saree_type_id
        WHERE i.id = ?`;

        db.query(query, [productId], (err, results) => {
            if (err) {
                // console.error("Error executing query:", err.message);
                return res.status(500).json({ message: `Internal server error: ${err.message}` });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: `Product with ID ${productId} not found` });
            }
            return res.status(200).json({
                message: 'Product details retrieved successfully',
                data: results[0]
            });
        });
    } catch (error) {
        console.error("Error in catch block:", error.message);
        return res.status(500).json({ message: `Error fetching product details: ${error.message}` });
    }
};


// Get all products with images, filters, and pagination
exports.getAllProducts = async (req, res) => {
    let { color, minPrice, maxPrice,sareeType, fabricType, occasion, weaveType, sortBy,page=1,limit=10} = req.query;
     


    try {
        let query = `SELECT 
		i.id AS item_id,
		ft.fabric_type_name, 
		co.country_of_origin,
		i.price,
        w.weave_type_name as weave_name,
        ot.occasion_name,
        i.discount,
        i.new_arrival,
        i.des,
        i.rating,
        i.stock_quantity,
        i.code_name,
        i.image_url1,
        i.image_url2,
        i.image_url3,
        i.image_url4,
        i.image_url5,
        i.image_url6,
        i.main_image_url,
        c.color_name,
        c.color_des,
        c.color_code,
        i.title,
        i.new_arrival,
        s.size,
        st.saree_name,
        i.weight,
        i.stock_quantity,
        i.included_components,
        i.boluse_des
        from items i
        left JOIN colors c ON c.id = i.color_id
        left JOIN fabric_types ft ON ft.id = i.fabric_type_id
        left JOIN size s ON s.id = i.size_id
        left JOIN occasion_types ot ON ot.id = i.occasion_id
        left JOIN countries co ON co.id = i.country_id
        LEFT JOIN weave_types w ON w.id = i.weave_type_id 
        left join saree_types st on st.id= i.saree_type_id
        WHERE 1 = 1`;

        let queryParams = [];

        // Apply filters
        if (color) {
            let colorValues = color.split(',');
            let placeholders = colorValues.map(() => '?').join(',');
            query += ` AND i.color_id IN (${placeholders})`;
            queryParams.push(...colorValues);
        }
        if (minPrice) {
            query += `AND i.price >= ?`;
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            query += `AND i.price <= ?`;
            queryParams.push(maxPrice);
        }
        // if (fabricType) {
        //     query +=`AND ft.fabric_type_name = ?`;
        //     queryParams.push(fabricType);
        // }
        if (sareeType) {
            let sareeValues = sareeType.split(',');
            let placeholders = sareeValues.map(() => '?').join(',');
            query += ` AND i.saree_type_id IN (${placeholders})`;
            queryParams.push(...sareeValues);
          }
          
        // if (occasion) {
        //     query += ` AND ot.occasion_name = ?`;
        //     queryParams.push(occasion);
        // }
        if (occasion) {
            let occasionValues = occasion.split(',');
            let placeholders = occasionValues.map(() => '?').join(',');
            query += ` AND i.occasion_id IN (${placeholders})`;
            queryParams.push(...occasionValues);
        }
        
        
        
        if (weaveType) {
            console.log("weavew",weaveType)
            let weaveValues = weaveType.split(',');
            let placeholders = weaveValues.map(() => '?').join(',');
            query += ` AND i.weave_type_id IN (${placeholders})`;
            queryParams.push(...weaveValues);
        }
        // Sorting
        if (sortBy === 'price_asc') {
            query += `ORDER BY i.price ASC`;
        } else if (sortBy === 'price_desc') {
            query += `ORDER BY i.price DESC`;
        }

        // if(!color || !minPrice || !maxPrice || !sareeType || !fabricType || !occasion || !weaveType){

        //     // Pagination (ensure limit and offset are integers)
        //     const offset = (parseInt(page) - 1) * parseInt(limit);
        //     query += ` LIMIT ? OFFSET ?`;
        //     queryParams.push(parseInt(limit), offset);
        //     console.log("Tested Params:", queryParams);
        // }

        // console.log("error", query, queryParams);

        db.query(query, queryParams, (err, results) => {
            if (err) {
                // console.error("Error executing query:", err.message);
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



exports.createProduct = async (req, res) => {
    const {
        colorId, sizeId, occasionId, countryId, weaveTypeId, title, price, discount, 
        stockQuantity, main_image_url, weight, includedComponents, boluse_des, 
        newArrival, sareeTypeId, productCode, categoryId
    } = req.body;
    // console.log('reqcreate', req.body);
    if (!title) {
        return res.status(400).json({ message: 'Title is required.' });
    }
    // console.log("Received title:", req.body.title);
//    console.log("Received files:", req.files);
    
  

    let images = [];

    // Upload each file to Cloudinary
    if (req.files && req.files.length > 0) {
        try {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path);
                images.push(result.secure_url); // Add URL directly to the `images` array
            }
        } catch (error) {
            return res.status(500).json({ message: `Error uploading images: ${error.message}` });
        }
    } else {
        console.log('No files found in req.files');
    }

    // Ensure the images array has exactly six entries, filling with `null` if necessary
    while (images.length < 6) {
        images.push(null);
    }

    try {
        const query = `INSERT INTO items (
            color_id, size_id, occasion_id, country_id, weave_type_id, title, price, 
            discount, stock_quantity, image_url1, image_url2, image_url3, image_url4, 
            image_url5, image_url6, main_image_url, weight, included_components, boluse_des, 
            new_arrival, saree_type_id, code_name, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            colorId, sizeId, occasionId || null, countryId, weaveTypeId, title, price, 
            discount, stockQuantity, ...images, main_image_url, weight, includedComponents, 
            boluse_des, newArrival, sareeTypeId, productCode, categoryId
        ];

        db.query(query, values, (err, results) => {
            if (err) {
                return res.status(500).json({ message: `Internal server error: ${err.message}` });
            }
            return res.status(201).json({
                status: 201,
                data: { id: results.insertId },
                message: 'Product created successfully'
            });
        });
    } catch (error) {
        return res.status(500).json({ message: `Error creating product: ${error.message}` });
    }
};



// Delete product by ID
// exports.deleteProduct = async (req, res) => {
//     const productId = req.params.id;
//     console.log('Product ID received for deletion:', productId);  // Log the received ID
  
//     if (!productId) {
//       return res.status(400).json({ message: 'Product ID is required' });
//     }
  
//     try {
//       const query = `DELETE FROM items WHERE id = ?`;
//       db.query(query, [productId], (err, results) => {
//         if (err) {
//           return res.status(500).json(new ApiError(500, `Internal server error: ${err.message}`));
//         }
//         if (results.affectedRows === 0) {
//           return res.status(404).json(new ApiError(404, `Product with ID ${productId} not found`));
//         }
//         return res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
//       });
//     } catch (error) {
//       return res.status(500).json(new ApiError(500, `Error deleting product: ${error.message}`));
//     }
//   };
  
exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    // console.log('Product ID received for deletion:', productId);  
  
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
  
    try {
      const query = `DELETE FROM items WHERE id = ?`;
      db.query(query, [productId], (err, results) => {
        if (err) {
          return res.status(500).json(new ApiError(500, `Internal server error: ${err.message}`));
        }
        if (results.affectedRows === 0) {
          return res.status(404).json(new ApiError(404, `Product with ID ${productId} not found`));
        }
        return res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
      });
    } catch (error) {
      return res.status(500).json(new ApiError(500, `Error deleting product: ${error.message}`));
    }
  };
  