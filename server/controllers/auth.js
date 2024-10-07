import validator from 'email-validator'
import User from '../models/user.js'
import { comparePassword, hashPassword } from '../helpers/auth.js'
import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'

export const api = (req, res) => {
  res.send(`The current time is ${new Date().toLocaleTimeString()}`)
}

export const login = async (req, res) => {
  const { email, password } = req.body
  if (!validator.validate(email)) {
    return res.json({ error: 'A valid email is requred' })
  }
  if (!email?.trim()) {
    return res.json({ error: 'Email is required' })
  }
  if (!password?.trim()) {
    return res.json({ error: 'Password is required' })
  }
  if (password?.length < 6) {
    return res.json({ error: 'Password must be at least 6 characters long' })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      try {
        const createdUser = await User.create({
          email,
          password: await hashPassword(password),
          username: nanoid(6)
        })
        const token = jwt.sign(
          { _id: createdUser._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        )
        res.json({
          token,
          user: createdUser
        })
      } catch (err) {
        return res.json({
          error: 'Validation error'
        })
      }
    } else {
      const match = await comparePassword(password, user.password)
      if (!match) {
        return res.json({
          error: 'Wrong password'
        })
      } else {
        const token = jwt.sign(
          { _id: createdUser._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        )

        res.json({
          token,
          user
        })
      }
    }
  } catch (err) {
    console.log('login error ', err)
    res.json({
      error: 'Something went wrong. Try again.'
    })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    let user = await User.findOne({ email })
    if (!user) {
      return res.json({
        error: 'If we find your account, we will contact you shortly'
      })
    } else {
      const password = nanoid(6)
      //sending temporary password to the user's email using AWS services (can't right now)
      user.password = hashPassword(password)
      console.log(
        `Password reset initiated from ${email}, new password is:`,
        password
      )
      await user.save()
    }
  } catch (err) {
    return res.json({
      error: 'There was an error. Please try again later.'
    })
  }
}

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.password = undefined
    res.json(user)
  } catch (err) {
    console.log(err)
  }
}

export const updatePassword = async (req, res) => {
  try {
    let { password } = req.body
    // Trim the password
    password = password ? password.trim() : ''
    if (!password) {
      return res.json({ error: 'Password is required' })
    }
    if (password.length < 6) {
      return res.json({
        error: 'Password should be minimum 6 characters long'
      })
    }
    const user = await User.findById(req.user._id)
    const hashedPassword = await hashPassword(password)
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword
    })
    res.json({ success: true })
  } catch (err) {
    console.log(err)
    res
      .status(403)
      .json({ error: 'An error occurred while updating the password' })
  }
}

export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' })
    }
    const trimmedUsername = username.trim()

    const existingUser = await User.findOne({
      username: trimmedUsername
    })
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' })
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username: trimmedUsername },
      { new: true, runValidators: true }
    )
    if (!updatedUser) {
      return res.status(404).json({ error: 'Update failed. Try again.' })
    }
    updatedUser.password = undefined
    updatedUser.resetCode = undefined
    res.json(updatedUser)
  } catch (err) {
    console.log(err)
    if (err.code === 11000) {
      // MongoDB duplicate key error code
      return res.status(400).json({ error: 'Username is already taken' })
    } else {
      return res
        .status(500)
        .json({ error: 'An error occurred while updating the profile' })
    }
  }
}
