import validator from "email-validator";
import User from "../models/user.js";
import { hashPassword } from "../helpers/auth.js";
import {nanoid} from "nanoid";
import jwt from "jsonwebtoken";

export const api = (req, res) => {
    res.send(`The current time is ${new Date().toLocaleTimeString()}`);
}

export const login = async (req,res) => {
    const {email,password}= req.body;
    if(!validator.validate(email)){
        return res.json({error: "A valid email is requred"});
    }
    if(!email?.trim()){
        return res.json({error: "Email is required"});
    }
    if(!password?.trim()){
        return res.json({error: "Password is required"});
    }
    if(password?.length < 6){
        return res.json({error: "Password must be at least 6 characters long"});
    }

    try{
        const user = await User.findOne({email});
        if(!user){
            try{
                const createdUser = await User.create({
                    email,
                    password: await hashPassword(password),
                    username: nanoid(6),
                });
                const token = jwt.sign(
                    {_id: createdUser._id},
                    process.env.JWT_SECRET,
                    {expiresIn: '7d'}
                );
                createdUser.password = undefined;
                res.json({
                    token,
                    user: createdUser,
                });
            }
            catch(err){
                return res.json({
                    error: "Invalid email. Please use a valid email address"
                });
            }
        }
    }
    catch{

    }
}