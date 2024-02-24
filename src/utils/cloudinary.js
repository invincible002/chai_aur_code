import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dphfcvum0",
  api_key: "244329251875969",
  api_secret: "PaBh-TczuaDvDudXyETHoP8U_3Y",
});

const uploadOnCloudinary = async (loacalFilePath) => {
  try {
    if (!loacalFilePath) return null;
    // upload the file
    const response = await cloudinary.uploader.upload(loacalFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded
    // console.log("File is uploaded on cloudinary");
    fs.unlinkSync(loacalFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(loacalFilePath);
    console.log(error, process.env.CLOUDINARY_API_KEY);
    return null;
  }
};

export { uploadOnCloudinary };
