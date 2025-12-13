// Old buggy code (commented out):
// export const verifyJWT = asyncHandler(async(req,res,next) => {
//    try {
//     const token =  req.cookies?.accessToken || req.header("Authirization")?.replace("Bearer","")
//     if (token) {
//      throw new ApiError(401,"Unauthorized request");
//     }
//    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
//    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
//    if (!user) {
//     throw new ApiError(401,"Invalid Access Token")
//    }
//    req.user = user;
//    next()
//    } catch (error) {
//      throw new ApiError(401,error?.message || "Invalid Access Token")
//    }
// })

import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {
   try {
     // Get token from cookies or Authorization header
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();

     // If no token provided, throw unauthorized error
     if (!token) {
       throw new ApiError(401, "Unauthorized request - No access token provided");
     }

     // Verify the token using the secret
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

     // Find the user by ID from the decoded token
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

     // If user not found, throw invalid token error
     if (!user) {
       throw new ApiError(401, "Invalid Access Token - User not found");
     }

     // Attach user to request object
     req.user = user;
     next();
   } catch (error) {
     // Handle JWT errors or other issues, throw 401
     throw new ApiError(401, error?.message || "Invalid Access Token");
   }
})
