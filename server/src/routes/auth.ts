import { Request, Response, Router } from "express" 
import { validationResult, Result, ValidationError } from "express-validator"
import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import { User, IUser } from "../models/User"
import { registerValidation, loginValidation } from "../validators/inputValidation"
import upload from "../middleware/multer-config"
import { validateToken, CustomRequest } from "../middleware/validateToken"
import dotenv from "dotenv"


dotenv.config()

const router: Router = Router()

// Register
router.post("/register", registerValidation,
    async (req: Request, res: Response) => {
        const errors: Result<ValidationError> = validationResult(req)

        if (!errors.isEmpty()) {
             // console.log(errors)
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const existingUser: IUser | null = await User.findOne({ username: req.body.username })
            // console.log(existingUser)
            if (existingUser) {
                return res.status(403).json({ message: "Username already in use" })
            }

            const salt: string = bcrypt.genSaltSync(10)
            const hash: string = bcrypt.hashSync(req.body.password, salt)

            const newUser: IUser = await User.create({
                username: req.body.username,
                password: hash
            })
            // console.log("New user:", newUser)
            return res.status(200).json(newUser)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// Login
router.post("/login", loginValidation,
    async (req: Request, res: Response) => {
        const errors: Result<ValidationError> = validationResult(req)

        if (!errors.isEmpty()) {
            // console.log(errors)
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const user: IUser | null = await User.findOne({ username: req.body.username })
             // console.log(user)

            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }

            const match: boolean = bcrypt.compareSync(req.body.password, user.password) // compares entered password with hashed password
            // console.log(match)
            if (!match) { // if passwords dont match
                return res.status(401).json({ message: "Incorrect password" })
            }

            const jwtPayload: JwtPayload = {
                _id: user._id,
                username: user.username
            }

            const token: string = jwt.sign(jwtPayload, process.env.SECRET as string, { expiresIn: "2h" })
            // console.log("Generated jwt and username:", token user.username);
            return res.status(200).json({ token, username: user.username }) 

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// get the info of current logged in user
router.get("/me", validateToken, 
    async (req: CustomRequest, res: Response) => {
        try {
            const user: IUser | null = await User.findById(req.user?._id)
            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }

            return res.status(200).json(user)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// upload a profile pic
router.put("/profile-picture", validateToken, upload.single("image"),
    async (req: CustomRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No image uploaded" })
            }

            const imgPath = req.file.path.replace("public", "") 
            const user: IUser | null = await User.findByIdAndUpdate(
                req.user?._id,
                { profilePicture: imgPath },
                { new: true } // returns the updated document instead of the old one
            )

            return res.status(200).json(user)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

export default router