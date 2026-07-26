import { body } from "express-validator"

export const registerValidation = [
    body("username").trim().escape().isLength({ min: 3, max: 25 }),
    body("password")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
]

export const loginValidation = [
    body("username").trim().escape(),
    body("password").trim()
]