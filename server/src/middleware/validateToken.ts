import { Request, Response, NextFunction } from "express" // same from my exercise 8 work, excluding the validAdmin function expression
import jwt, { JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export interface CustomRequest extends Request {
    user?: JwtPayload
}

// validating logged-in user
export const validateToken = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token: string | undefined = req.header("authorization")?.split(" ")[1]

    if (!token) {
        return res.status(401).json({ message: "Token not found." })
    }

    try {
        const verified = jwt.verify(token, process.env.SECRET as string) as JwtPayload
        req.user = verified
        next()

    } catch (error) {
        return res.status(401).json({ message: "Token not found." })
    }
}