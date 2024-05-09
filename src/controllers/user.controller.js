import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{

    //1 get user details from frontend
    
    const {username,email,fullName,password} = req.body;
    console.log("email:",email);

    //2 validation

    if(
        [fullName,email,password,username].some((field)=>(
            field?.trim() === ""
        ))
    ){
        throw new ApiError(400,"All fields are compulsory or required")
    }
    if(!email.includes("@")){
        throw new ApiError(400,"Please Enter valid Email");
    }

    //3 check if user already exists

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    console.log("Existing User: ",existedUser);
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }



    //4 check for images and avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("The files of the avatar are ",req.files.avatar[0].path);
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("The files of the coverImage are ",req.files.coverImage[0].path);

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //5 upload images and avatar to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log(avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log(coverImage);

    if(!avatar){
        throw new ApiError(400,"Avatar image is required")
    }

    //6 create user Object - create db entry

    const user = await User.create({
        fullName,
        avatar:avatar?.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username: username.toLowerCase(),
    })

    //7 remove password and refresh token field from response 
    // we remove them by using select method and give - sign before the non required fields like password and refreshToken in String form

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    
    //8 check for user creation

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    //9 show response
    
    return res.status(201).json(
        new ApiResponse(201,createdUser,"User Registered Successfully")
    )



});


export {registerUser};