const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');


exports.getItemCategory = async(req,res)=>{

    try {
        const query = `Select * from categories where 1 =1 `
         db.query(query,(error,result)=>{
            if(error){
              return  res.status(400).json(
                new ApiError(400,`message : ${error}`)
               )
            }
            if(result.length== 0)
            {return new ApiResponse(200, result,`No data found`)
            }
            return res.status(200).json(
                new ApiResponse(200, result,`message : data retrive successfully`)
            );
            
              
         })

    } catch (error) {
         return new ApiError(500,`message : ${error}` )
    }
}


exports.getItemCode = async(req, res)=>{
   
        try {
            const  query = `Select * from item_code where 1 = 1 `
            db.query(query,(error,result) => {
                console.log("error", error)
                if(error){
                    return  res.status(400).json(
                      new ApiError(400,`error : ${error}`)
                     )
                  }
                  if(result.length > 0)
                  {
                    return res.status(200).json(
                        new ApiResponse(200, result,`message : data retrive successfully`)
                    );
                }else{
                    return res.status(200).json(new ApiResponse(200, result,`No data found`))
                }
                 
            })
        } catch (error) {
            return new ApiError(500,`message : ${error}` )
        }
}

exports.getItemColors= async(req, res)=>{
   
    try {
        const  query = `Select * from colors where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}

exports.getItemFabric= async(req, res)=>{
   
    try {
        const  query = `Select * from fabric_types where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}

exports.getItemWeave= async(req, res)=>{
   
    try {
        const  query = `Select * from weave_types where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}

exports.getItemSize= async(req, res)=>{
   
    try {
        const  query = `Select * from size_types where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}

exports.getItemOcassion= async(req, res)=>{
   
    try {
        const  query = `Select * from occasion_types where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}

exports.getItemSaree = async(req, res)=>{
   
    try {
        const  query = `Select * from saree_types where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}
exports.getItemCountry = async(req, res)=>{
   
    try {
        const  query = `Select * from countries where 1 = 1 `
        db.query(query,(error,result) => {
            console.log("error", error)
            if(error){
                return  res.status(400).json(
                  new ApiError(400,`error : ${error}`)
                 )
              }
              if(result.length > 0)
              {
                return res.status(200).json(
                    new ApiResponse(200, result,`message : data retrive successfully`)
                );
            }else{
                return res.status(200).json(new ApiResponse(200, result,`No data found`))
            }
             
        })
    } catch (error) {
        return new ApiError(500,`message : ${error}` )
    }
}


