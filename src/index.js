import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'
import { uploadOnCloudinary } from "./utils/cloudinary.js";
dotenv.config({
    path:"./env"
})

// console.log(process.env.MONGODB_URI)
connectDB()
.then(
()=>{
    app.on("error",(err)=>{
        console.log("ERRR:",err);
        throw err;
    });
    app.listen(process.env.PORT || 8000,()=>{

        console.log(`Server started on port ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("MongoDb connection failed",err);
})












/*
import express from express;
const app = express();

(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(err)=>{
        console.log("Error: ",err);
        throw err;
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App listening on port ${process.env.PORT}`);
       })
    }
    catch(err){
        console.error("ERROR: ",err);
        throw err;
    }
})()
*/