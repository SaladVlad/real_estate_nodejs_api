import validator from "email-validator";
import User from "../models/user.js";
import { comparePassword, hashPassword } from "../helpers/auth.js";
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
                res.json({
                    token,
                    user: createdUser,
                });
            }
            catch(err){
                return res.json({
                    error: "Validation error"
                });
            }
        }
        else{
            const match = await comparePassword(password,user.password);
            if(!match){
                return res.json({
                    error: "Wrong password",
                });
            }
            else{
                const token = jwt.sign(
                    {_id: createdUser._id},
                    process.env.JWT_SECRET,
                    {expiresIn: '7d'}
                );

                res.json({
                    token,
                    user,
                });
            }
        }
    }
    catch(err){
        console.log("login error ",err);
        res.json({
            error: "Something went wrong. Try again."
        });
    }
}

export const forgotPassword = async (req,res) => {
    try{
        const{email} = req.body;
        let user = await User.findOne({email});
        if(!user){
            return res.json({error: "If we find your account, we will contact you shortly"});
        }
        else{
            const password = nanoid(6);
            //sending temporary password to the user's email using AWS services (can't right now)
            user.password = hashPassword(password)
            console.log(`Password reset initiated from ${email}, new password is:`,password)
            await user.save();
        }
    }
    catch (err) {

    }
};