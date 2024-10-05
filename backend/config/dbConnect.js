import mongoose from "mongoose"

export const connectDatabase=()=>{
    let DB_URI="";
    
    if ((process.env.NODE_ENV.trim())===("DEVELOPMENT")) DB_URI=process.env.DB_LOCAL_URI;
    if ((process.env.NODE_ENV.trim())===("PRODUCTION")) DB_URI=process.env.DB_URI;
    
    mongoose.connect(process.env.DB_LOCAL_URI).then((con)=>{
        console.log(`MongoDB Database connected with HOST: ${con?.connection?.host}`)
    })
}