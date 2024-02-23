import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (loacalFilePath) => {
  try {
    if (!loacalFilePath) return null;
    // upload the file
    const response = await cloudinary.uploader.upload(loacalFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded
    console.log("File is uploaded on cloudinary");
    return response;
  } catch (error) {
    fs.unlinkSync(loacalFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
