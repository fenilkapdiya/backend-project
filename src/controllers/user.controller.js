import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation - not empty
  // check if user exists : username, email
  //check for images , check for avatar
  //upload them to cloudinary, avatar
  //craete user oblect - create entry in db
  //remove password and refress tokenn field from response
  //check for user creation
  //return res

  const { fullName, email, password, username } = req.body;
  console.log("email :", email);

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with this username or email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;


let coverImageLocalPath ;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  coverImageLocalPath = req.files.coverImage[0].path;
}


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed, please try again");
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User register successful"));

});

export { registerUser };















// import { asyncHandler } from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import { User } from "../models/user.model.js";
// import { uploadToCloudinary } from "../utils/cloudinary.js";
// import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = asyncHandler(async (req, res ,next) => {
//   const { fullName, email, password, username } = req.body;
//   // console.log("email :", email);

//   // Basic field validation
//   if (
//     [fullName, email, password, username].some(
//       (field) => typeof field !== "string" || field.trim() === ""
//     )
//   ) {
//     throw new ApiError(400, "All fields are required");
//   }

//   // Check if user exists
//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(
//       409,
//       "User already exists with this username or email"
//     );
//   }

//   // Safely read files (Multer-style: req.files = { avatar: [..], coverImage: [..] })
//   const avatarFile = Array.isArray(req.files?.avatar)
//     ? req.files.avatar[0]
//     : undefined;

//   const coverImageFile = Array.isArray(req.files?.coverImage)
//     ? req.files.coverImage[0]
//     : undefined;

//   const avatarLocalPath = avatarFile?.path;
//   const coverImageLocalPath = coverImageFile?.path;

//   if (!avatarLocalPath) {
//     throw new ApiError(400, "Avatar file is required");
//   }

//   // Upload to Cloudinary
//   const avatar = await uploadToCloudinary(avatarLocalPath);
//   const coverImage = coverImageLocalPath
//     ? await uploadToCloudinary(coverImageLocalPath)
//     : null;

//   if (!avatar) {
//     throw new ApiError(400, "Avatar upload failed");
//   }

//   // Create user
//   const user = await User.create({
//     fullName,
//     avatar: avatar.url,
//     coverImage: coverImage?.url || "",
//     email,
//     password,
//      username: username.toLowerCase(),
//   });

//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );

//   if (!createdUser) {
//     throw new ApiError(500, "User creation failed, please try again");
//   }

//   return res
//     .status(201)
//       .json(new ApiResponse(200, createdUser, "User register successful"));
// });

// export { registerUser };