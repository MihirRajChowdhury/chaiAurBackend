import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken};
    }
    catch(err){
        throw new ApiError(500,"Something went wrong while generating Access and Refresh Token")
    }
}

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
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log(req.files.avatar)

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //5 upload images and avatar to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar image is required")
    }

    //6 create user Object - create db entry

    const user = await User.create({
        fullName,
        avatar:avatar?.secure_url,
        coverImage:coverImage?.secure_url||"",
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

const loginUser = asyncHandler(async (req,res)=>{
// take req.body from the data given by the user 

const {username,email,password} = req.body;

if(!username && !email){
    throw new ApiError(400,"username or email is required")
}

// check if the user with the same username/email is present or not

const user = await User.findOne({
    $or:[{username},{email}]
})

// find user from db
if(!user){
    throw new ApiError(404,"User does not exist")
}
// check password if false the give wrong password
   const isPasswordValid = await user.isPasswordCorrect(password);
   if(!isPasswordValid){
    throw new ApiError(404,"Check the password you inserted");
}
// if true generate access and refresh token
const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

// send these tokens in the form of secure cookies 

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(200,{
        user,loggedInUser,accessToken,refreshToken
    },
    "User logged In Successfully"
)
)
})

const logoutUser = asyncHandler(async(req,res)=>{
    // find user using middleware 
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new :true
        })
     const options={
        httpOnly:true,
        secure:true
    }

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!inComingRefreshToken){ // check this line here for error
    throw new ApiError(401,"Unauthorized request")
   }
   try {
    const decodedToken = jwt.verify(
     inComingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
     if(!user){
         throw new ApiError(401,"Invalid refresh token")
     }
     if(inComingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
     }
 
     const options = {
         httpOnly:true,
         secure:true
     }
     
     const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken,refreshToken:newRefreshToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message||"Invalid Refresh Token")
   }



})

const changeUserPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user =await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Old Password was incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false});
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    
    return res.status(200).json(new ApiResponse(200,req.user,"Current User fetched Successfully"));
})

const updateAcccountDetails = asyncHandler(async(req,res)=>{
const {fullName,email} = req.body;
if(!(fullName || email)){
    throw new ApiError(401,"Email and Full Name both are required");
}
const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            fullName:fullName,
            email:email,
        }
    },
    {new:true}
).select("-password")


return res
.status(200)
.json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"No files found in the provided path")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url,
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar Updated Successfully"));
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"No files found in the provided path")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on coverImage")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url,
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image Updated Successfully"));
})


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username not found")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            },
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            },
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"           
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"  
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in: [req.user?._id,"$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,


            }
        }
    ])
    console.log(channel);
    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"user Channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
      {  
        $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1,
                            }
                        }
                    ]
                }

            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
            }
            
        ]


    }
}
]
)
return res
.status(200)
.json(new ApiResponse(200,user[0].watchHistory,"Watch History Fetched Successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateAcccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory 
    
};