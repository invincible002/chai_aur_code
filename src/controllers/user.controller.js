import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(500).json({ message: "Error while creating tokens" });
  }
};
const registerUser = async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists
  // check for images, check for avatardf
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some(
      (field) => field?.trim() === "" || field?.trim() === undefined
    )
  ) {
    return res.status(400).json({ message: "Invalid Request" });
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res.status(409).json({ message: "User Already Registered" });
  }

  let avatarLocalPath;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  }
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    return res.status(400).json({ message: "Avatar file is required" });
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return res.status(400).json({ message: "Avatar file is required" });
  }

  try {
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      userName: username.toLowerCase(),
    });

    // user.then(console.log(user));
    return res.status(200).json({ user, message: "User Created Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error, message: "Error while creating user" });
  }
};

const loginUser = async (req, res) => {
  // get email/username and password from frontend
  // validate the data
  // search user using username or email
  // if user found then compare password otherwise send user not found
  // check password matches or not
  // generate refresh and access token and send in cookies

  const { email, username, password } = req.body;

  if (!username && !email) {
    return res.status(400).json({ message: "Username or email is required" });
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    return res.status(405).json({ message: "Password is not correct" });
  }
  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      user: loggedInUser,
      accessToken,
      refreshToken,
      message: "Login Successfull",
    });
};

const logoutUser = async (req, res) => {
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

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "User Logged Out Successfully" });
};

const refreshAccessToken = async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized Request" });
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      return res.status(401).json({ message: "Invalid Refresh Token" });
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh token is expired or used" });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        accessToken,
        refreshToken: newRefreshToken,
        message: "Tokens refreshed",
      });
  } catch (error) {
    return res.status(401).json(error?.message || error);
  }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };
