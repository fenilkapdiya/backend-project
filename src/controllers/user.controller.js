import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { trusted } from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessAndRefreshTokens:", error);
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

// user register

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
  // console.log("email :", email);

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

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar to cloudinary");
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

  // Generate tokens for the new user
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
          refreshToken,
        },
        "User registered successfully"
      )
    );
});

// login user

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //password match
  //access and refresh token
  //send cookies and response

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not existe");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loged in successfuly"
      )
    );
});

// logout user

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user loged out"));
});

//refreshtoken end point

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or use");
    }

    const option = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newrefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPaassword } = req.body;

  const useer = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw (new ApiError(100), "Invalid old password");
  }

  user.password = newPaassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "all fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Acount details upadate successfully"));
});

const upadateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLoacalPath = req.file?.path;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadToCloudinary(avatarLoacalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar upadate successfully"));
});

const upadateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLoacalPath = req.file?.path;

  if (!coverImageLoacalPath) {
    throw new ApiError(400, "cover image file is missing");
  }

  const coverImage = await uploadToCloudinary(coverImageLoacalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image upadate successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  upadateUserAvatar,
  upadateUserCoverImage,
};

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
