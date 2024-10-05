import mongoose from "mongoose";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter your name"],
        maxLength:[50,"your name cannot exceed 50 characters"],
    },
    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:true,
    },
    password:{
        type:String,
        required:[true,"Please enter your password"],
        minLength:[6,"your password must be longer than 6 characters"],
        select:false,
    },
    avatar:{
        public_id:String,
        url:String,
    },
    role:{
        type:String,
        default:"user",
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
},{timestamps:true});

//Encrypting password before saving the user
userSchema.pre("save",async function (next){
    if (!this.isModified("password")){
        next();
    }

    this.password=await bycrypt.hash(this.password,10);
})

//Return JWT Token
userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    })
}

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword){
    return await bycrypt.compare(enteredPassword,this.password);
}

// Generate password reset token
userSchema.methods.getResetPasswordToken=function(){

    // Generate token
    const resetToken=crypto.randomBytes(20).toString("hex")
    

    // Hash and set to resetPasswordToken field
    this.resetPasswordToken=crypto.createHash("sha256").update(resetToken).digest("hex");
    console.log(this.resetPasswordToken)


    // Set token expire time
    this.resetPasswordExpire=Date.now() + 30 *60*1000

    return resetToken;
}




export default mongoose.model("User",userSchema);