import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import 
import userRouter from "./routes/user.routes.js"

// routes declration 
app.use("/api/v1/users",userRouter) // the user is currently on http://localhost:8000/api/v1/users and the userRouter will take the router to  http://localhost:8000/api/v1/users/register or http://localhost:8000/api/v1/users/login or etc here users/x x is provided my userRouter 

export {app};