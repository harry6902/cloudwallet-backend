const mongoose= require('mongoose');
const {Schema}=require('mongoose');



const UserSchema = new Schema({
       username: {
        type:String,
        required:true,
        unique:true
       },
       password: {
        type:String,
        required:true,
       },
       email:{
        type:String,
        required:true
       },
       privateKey:{
        type:String,
        unique:true,
        required:true
       },
       publicKey: {
        type:String,
        unique:true,
        required:true
       }
})


const userModel = mongoose.model("users",UserSchema)

module.exports={
    userModel
}