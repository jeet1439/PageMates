import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
    type: String,
    required: true,
    unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    },
    profileImage: {
        type: [String],
        default: []
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    followings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

const User = mongoose.model("User", userSchema);

export default User;
