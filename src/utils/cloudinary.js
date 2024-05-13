import {v2 as cloudinary} from 'cloudinary';
import { log } from 'console';

import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,

});
const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) {
          console.log("Error local file path not found");
          return null;}
        // upload the file on cloudinary
          // console.log("Trying to upload the file on cloudinary");
       const response = await cloudinary.uploader.upload(localFilePath);
        // file has been uploaded successfully
        // console.log("File has been uploaded on cloudinary",response);
        fs.unlinkSync(localFilePath)  
        return response;
    }
    catch(err){
      fs.unlinkSync(localFilePath)  // removes the locally saved temporary file as the upload operation has failed
      // console.log(localFilePath)
      // console.log("Here is an unlinkSync Error",err);
      return null;
    }
}

export {uploadOnCloudinary};