import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try{
     const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     console.log(`\n MONGOdb connected !! DB HOST :${connectionInstance.connection.host}`);
    //  console.log(connectionInstance)
    }
    catch(err){
        console.log("db index Error: ",err);
        process.exit(1);       
    }
}

export default connectDB;

