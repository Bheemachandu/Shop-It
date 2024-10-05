import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User from "../models/user.js";
import { getResetPasswordTemplate } from "../utils/emailTemplates.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendEmail from "../utils/sendEmail.js";
import sendToken from "../utils/sendToken.js";
import crypto from "crypto"


// Register user => /api/register
export const registerUser=catchAsyncErrors (async(req,res,next) =>{
    console.log(req.body)
    const {name,email,password}=req.body


    const user=await User.create({
        name,email,password,
    });

    console.log(user)

    sendToken(user,201,res)
});

// Login user => /api/login
export const loginUser=catchAsyncErrors (async(req,res,next) =>{
    const {email,password}=req.body
    
    if (!email || !password){
        return next(new ErrorHandler("Please enter email & password",400))
    }

    //Find user in the database
    const user=await User.findOne({email}).select("+password")

    if (!user){
        return next(new ErrorHandler("Invalid email or password",401))
    }

    //Check if password is correct
    const isPasswordMatched=await user.comparePassword(password)

    if (!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password",401))
    }

    sendToken(user,200,res)
});


//Logout User => /api/logout
export const logout=catchAsyncErrors(async(req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,  
    });
    

    res.status(200).json({
        message:"Logged Out",
    });
});

// Forgot password => /api/password/forgot
export const forgotPassword=catchAsyncErrors (async(req,res,next) =>{
    

    //Find user in the database
    const user=await User.findOne({email:req.body.email})

    if (!user){
        return next(new ErrorHandler("User not found with this email",404))
    }

    console.log(user)

    // Get reset password token
    const resetToken=await user.getResetPasswordToken()

    await user.save()

    // Create reset password url
    const resetUrl=`${process.env.FRONTEND_URL}/api/password/reset/${resetToken}`
    console.log(resetUrl)

    const message =getResetPasswordTemplate(user?.name,resetUrl)
    

    try{
        await sendEmail({
            email:user.email,
            subject: "ShopIT Password Recovery",
            message,
        });

        res.status(200).json({
            message:`Email sent to : ${user.email}`,
        })
    } catch(error){
        user.resetPasswordToken=undefined
        user.resetPasswordExpire=undefined

        await user.save();

        return next(new ErrorHandler(error?.message,500))
    }

    
});


// Reset password => /api/password/reset/:token
export const resetPassword=catchAsyncErrors (async(req,res,next) =>{

    // Hash the URL Token
    const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user =await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{ $gt:Date.now() }
    })

    if (!user){
        return next(new ErrorHandler("Password reset token is invalid or has been expired",400))
    }

    if(req.body.password!==req.body.confirmPassword){
        return next(new ErrorHandler("Passwords does not match",400))
    }

    // Set the new password
    user.password=req.body.password
    user.resetPasswordToken=undefined
    user.resetPasswordExpire=undefined
    
    await user.save();

    sendToken(user,200,res);

})

// Get current user profile => /api/me
export const getUserProfile =catchAsyncErrors (async (req,res,next) => {
    const user =await User.findById(req?.user?._id)

    res.status(200).json({
        user,
    });
});

// Update Password => /api/password/update
export const updatePassword =catchAsyncErrors (async (req,res,next) => {
    
    const user =await User.findById(req?.user?._id).select("+password");

    // Check the previous user password
    const isPasswordMatched= await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched){
        return next(new ErrorHandler("old Password is incorrect",400))
    }

    user.password=req.body.password;

    await user.save();


    res.status(200).json({
        success:true,
    });
});

// Update User Profile => /api/me/update
export const updateProfile =catchAsyncErrors (async (req,res,next) => {
    
    const newUserData = {
        name:req.body.name,
        email:req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user._id,newUserData,{new:true,});

    res.status(200).json({
        user,
    });
});

// Get all Users - ADMIN => /api/admin/users
export const allUsers =catchAsyncErrors (async (req,res,next) => {
    
    
    const users = await User.find();

    res.status(200).json({
        users,
    });
});

// Get User Details - ADMIN => /api/admin/users/:id
export const getUserDetails =catchAsyncErrors (async (req,res,next) => {
    
    
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`,400));
    }

    res.status(200).json({
        user,
    });
});


// Update User Details - ADMIN => /api/admin/users/:id
export const updateUser =catchAsyncErrors (async (req,res,next) => {
    
    const newUserData = {
        name:req.body.name,
        email:req.body.email,
        role:req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id,newUserData,{new:true,});

    res.status(200).json({
        user,
    });
});


// Delete User - ADMIN => /api/admin/users/:id
export const deleteUser =catchAsyncErrors (async (req,res,next) => {
    
    
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User not found with id: ${req.params.id}`,400));
    }

    // TODO - Remove user avatar from cloudinary

    await user.deleteOne();

    res.status(200).json({
        success:true,
    });
});

