import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res.status(409).json({ message: "User Already Registered" });
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
      username: username.toLowerCase(),
    });

    user.then(console.log(user));
    return res.status(200).json({ user, message: "User Created Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error while creating user" });
  }
};

export { registerUser };
