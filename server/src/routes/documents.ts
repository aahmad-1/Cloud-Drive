import { Response, Router } from "express"
import { CustomRequest, validateToken } from "../middleware/validateToken"
import { CloudDocument, ICloudDocument } from "../models/CloudDocument"

const router: Router = Router()

// get all documents belonging to to the current logged in user or documents shared with them
router.get("/", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.user?._id

        // finds docs where deleted is false (not in recycle bin) AND (I'm the owner OR I'm an editor)
        const documents: ICloudDocument[] = await CloudDocument.find({
            deleted: false, 
            $or: [{ ownerId: userId }, { editorIds: userId }]
        })
        // without $or, Mongoose would require BOTH conditions to be true
        // not ideal since a document a user has edit perms for (but not ownership) needs to show up

        return res.status(200).json(documents)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// create new document
router.post("/", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const newDocument: ICloudDocument = await CloudDocument.create({
            title: req.body.title || "Untitled Document",
            content: req.body.content || "",
            ownerId: req.user?._id,
            editorIds: [],
            publicView: false,
            deleted: false
        })

        // console.log(newDocument)
        return res.status(200).json(newDocument)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// Get a single document by id (owner, editor, or public view)
router.get("/:id", async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document || document.deleted) {
            return res.status(404).json({ message: "Document not found" })
        }

        // if a doc is public, everyone can view it (read-only), so no token needed
        if (document.publicView) {
            return res.status(200).json(document)
        }

        // if not public, it should be the owner or an editor try to access, so validate the token
        const token: string | undefined = req.header("authorization")?.split(" ")[1]
        if (!token) {
            return res.status(401).json({ message: "Token not found." })
        }

        validateToken(req, res, () => {
            const userId = req.user?._id
            const isOwner = document.ownerId === userId
            const isEditor = document.editorIds.includes(userId)

            if (!isOwner && !isEditor) {
                return res.status(403).json({ message: "You do not have permission to view this document" })
            }

            return res.status(200).json(document)
        })

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// edit a document's title and/or content. only for the documents owner or users with edit perms
router.put("/:id", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document || document.deleted) {
            return res.status(404).json({ message: "Document not found" })
        }

        const userId = req.user?._id
        const isOwner = document.ownerId === userId
        const isEditor = document.editorIds.includes(userId)

        if (!isOwner && !isEditor) {
            return res.status(403).json({ message: "You do not have permission to edit this document" })
        }

        if (req.body.title !== undefined) {
            document.title = req.body.title
        }

        if (req.body.content !== undefined) {
            document.content = req.body.content
        }

        await document.save()
        return res.status(200).json(document)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// move documents to recycle bin (can only be done a documents owner)
router.delete("/:id", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document) {
            return res.status(404).json({ message: "Document not found" })
        }

        if (document.ownerId !== req.user?._id) {
            return res.status(403).json({ message: "Only the owner of this document can delet it" })
        }

        document.deleted = true
        await document.save()
        return res.status(200).json({ message: "Document successfully moved to recycle bin" })

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

export default router