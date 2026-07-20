import express, { Express } from "express"
import path from "path"
import authRouter from "./src/routes/auth"
import documentRouter from "./src/routes/documents"
import morgan from "morgan"
import mongoose, { Connection } from "mongoose"
import dotenv from "dotenv"
import cors, { CorsOptions } from "cors"


dotenv.config()

const app: Express = express()
const port: number = parseInt(process.env.PORT as string) || 3000;

const corsOptions: CorsOptions = {
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

const mongoDB: string = process.env.MONGO_URI as string
mongoose.connect(mongoDB)
mongoose.Promise = Promise
const db: Connection = mongoose.connection

db.on("error", console.error.bind(console, "MongoDB connection error:"))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan("dev"))

app.use(express.static(path.join(__dirname, "../public")))
app.use("/api/auth", authRouter)
app.use("/api/documents", documentRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})