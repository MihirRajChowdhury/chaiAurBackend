import {v2 as cloudinary} from 'cloudinary';

import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//       if (!localFilePath) return null
//       //upload the file on cloudinary
//       const response = await cloudinary.uploader.upload(localFilePath, {
//           resource_type: "auto"
//       })
//       // file has been uploaded successfull
//       console.log("file is uploaded on cloudinary ", response.url);
//       return response;

//   } catch (error) {
//       fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//       return null;
//   }
// }

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) {
          console.log("Error local file path not found");
          return null;}
        // upload the file on cloudinary
       const response =await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
        // file has been uploaded successfully
        console.log("File has been uploaded on cloudinary",response.url);
        return response;
    }
    catch(err){
      fs.unlinkSync(localFilePath)  // removes the locally saved temporary file as the upload operation has failed
      console.log(localFilePath)
      console.log(err);
      return null;
    }
}

export {uploadOnCloudinary};