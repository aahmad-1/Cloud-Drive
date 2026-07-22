import multer, { StorageEngine, Multer } from "multer"; 
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/images");
    },
    filename: (req, file, cb) => {
        const id = uuidv4(); // generates a unique id (something like 'b18794e8-5d0d-417c-b361-ba38e78411b4')
        const extension = path.extname(file.originalname); // returns extension (bike.png returns .png)
        const originalFilename = path.parse(file.originalname).name; // returns only filename (bike.png returns just bike)
        cb(null, `${originalFilename}_${id}${extension}`);
    }
});

const upload: Multer = multer({ storage: storage });

export default upload;