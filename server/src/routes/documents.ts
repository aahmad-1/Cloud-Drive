import { Response, Router } from "express"
import { CustomRequest, validateToken } from "../middleware/validateToken"
import { CloudDocument, ICloudDocument } from "../models/CloudDocument"
import { User, IUser } from "../models/User"
import upload from "../middleware/multer-config"

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

        // find unique owner ids other than myself, so we can look up their usernames in one query
        const otherOwnerIds = [...new Set(documents.map(doc => doc.ownerId).filter(oid => oid !== userId))]
        const otherOwners: IUser[] = await User.find({ _id: { $in: otherOwnerIds } })

        const documentsWithOwner = documents.map(doc => {
            let ownerUsername: string
            if (doc.ownerId === userId) {
                ownerUsername = "You"
            } else {
                const owner = otherOwners.find(u => u._id.toString() === doc.ownerId)
                ownerUsername = owner ? owner.username : "Unknown"
            }
            return { ...doc.toObject(), ownerUsername }
        })

        return res.status(200).json(documentsWithOwner)

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

// get all documents in the recycle bin (owner only) moved here since
// moved here since express matches routes top-to-bottom, and /:id would otherwise treat "trash" as an id
router.get("/trash", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const documents: ICloudDocument[] = await CloudDocument.find({
            deleted: true,
            ownerId: req.user?._id
        })

        return res.status(200).json(documents)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// get a single document by id (owner, editor, or public view)
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

        // using updateOne + timestamps: false here instead of document.save(), since save() changes updatedAt automatically even when the actual content (title/text) didn't change
        await CloudDocument.updateOne( // ensures the "last updated field" doesnt update when deleting a doc/image to recycle bin, like Google Drive
            { _id: document._id },
            { $set: { deleted: true, deletedAt: new Date() } }, // $set just replaces a fields value directly
            { timestamps: false }
        )
        return res.status(200).json({ message: "Document successfully moved to recycle bin" })

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// give edit permission to another existing user (owner only)
router.put("/:id/share", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document || document.deleted) {
            return res.status(404).json({ message: "Document not found" })
        }

        if (document.ownerId !== req.user?._id) {
            return res.status(403).json({ message: "Only the owner of this document can share it" })
        }

        const targetUser: IUser | null = await User.findOne({ username: req.body.username })

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" })
        }

        if (targetUser._id.toString() === req.user?._id) {
            return res.status(400).json({ message: "cannot share with yourself" })
        }

        if (document.editorIds.includes(targetUser._id.toString())) {
            return res.status(400).json({ message: "already shared" })
        }

        document.editorIds.push(targetUser._id.toString())
        await document.save()

        return res.status(200).json(document)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// toggle the public read-only link (owner only)
router.put("/:id/public", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document || document.deleted) {
            return res.status(404).json({ message: "Document not found" })
        }

        if (document.ownerId !== req.user?._id) {
            return res.status(403).json({ message: "Only the owner can change sharing by link" })
        }

        document.publicView = req.body.publicView
        await document.save()

        return res.status(200).json(document)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// restore a document from recycle bin (owner only)
router.put("/:id/restore", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document) {
            return res.status(404).json({ message: "Document not found" })
        }

        if (document.ownerId !== req.user?._id) {
            return res.status(403).json({ message: "Only the owner can restore this document" })
        }
    
        // ensures the "last updated field" doesnt update when restoring a doc/image from recycle bin
        await CloudDocument.updateOne( 
            { _id: document._id },
            { $set: { deleted: false, deletedAt: null } },
            { timestamps: false }
        )
        const updated = await CloudDocument.findById(document._id)
        return res.status(200).json(updated)

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// permanently delete a document from recycle bin (owner only)
router.delete("/:id/permanent", validateToken, async (req: CustomRequest, res: Response) => {
    try {
        const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

        if (!document) {
            return res.status(404).json({ message: "Document not found" })
        }

        if (document.ownerId !== req.user?._id) {
            return res.status(403).json({ message: "Only the owner can permanently delete this document" })
        }

        await CloudDocument.findByIdAndDelete(req.params.id) // removes it from the database itself
        return res.status(200).json({ message: "Document permanently deleted" })

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// clone/make a copy of an existing document (owner or editor)
router.post("/:id/clone", validateToken, 
    async (req: CustomRequest, res: Response) => {
        try {
            const original: ICloudDocument | null = await CloudDocument.findById(req.params.id)
            if (!original || original.deleted) {
                return res.status(404).json({ message: "Document not found" })
            }

            const userId = req.user?._id
            const isOwner = original.ownerId === userId
            const isEditor = original.editorIds.includes(userId)
            if (!isOwner && !isEditor) {
                return res.status(403).json({ message: "You do not have permission to make a copy of this document" })
            }

            const clone: ICloudDocument = await CloudDocument.create({
                title: `Copy of ${original.title}`, // similar to how google docs perform doc copies
                content: original.content,
                type: original.type,
                imagePath: original.imagePath,
                ownerId: userId, // the user that clones a doc becomes the owner of the copy they made
                editorIds: [],
                publicView: false,
                deleted: false
            })

            return res.status(200).json(clone)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// upload an image as a new doc in the drive
router.post("/upload-image", validateToken, upload.single("image"),
    async (req: CustomRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No image uploaded" })
            }

            const imgPath = req.file.path.replace("public", "")
            const newDocument: ICloudDocument = await CloudDocument.create({
                title: req.body.title || req.file.originalname,
                content: "",
                type: "image",
                imagePath: imgPath,
                ownerId: req.user?._id,
                editorIds: [],
                publicView: false,
                deleted: false
            })
            return res.status(200).json(newDocument)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// try to claim the editing lock on a document we want to edit
router.put("/:id/lock", validateToken,
    async (req: CustomRequest, res: Response) => {
        try {
            const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)
            if (!document || document.deleted) {
                return res.status(404).json({ message: "Document not found" })
            }

            const userId = req.user?._id

            // if no other user has the doc open, or if you already have it open, you can claim/keep the doc editing perms
            if (!document.currentlyEditingBy || document.currentlyEditingBy === userId) {
                await CloudDocument.updateOne(
                    { _id: document._id },
                    { $set: { currentlyEditingBy: userId } },
                    { timestamps: false }
                )
                return res.status(200).json({ locked: true })
            }

            // another user already has the doc open, so tell the frontend which user exactly
            const lockedByUser: IUser | null = await User.findById(document.currentlyEditingBy)
            return res.status(200).json({ locked: false, lockedByUsername: lockedByUser?.username || "another user" })

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// release the editing lock if you can actually edit the doc to begin with
router.put("/:id/unlock", validateToken,
    async (req: CustomRequest, res: Response) => {
        try {
            const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)
            if (!document) {
                return res.status(404).json({ message: "Document not found" })
            }

            if (document.currentlyEditingBy === req.user?._id) {
                await CloudDocument.updateOne(
                    { _id: document._id },
                    { $set: { currentlyEditingBy: null } },
                    { timestamps: false }
                )
            }
            return res.status(200).json({ message: "Unlocked" })

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

// revoke edit permission from a user (owner only)
router.put("/:id/revoke", validateToken,
    async (req: CustomRequest, res: Response) => {
        try {
            const document: ICloudDocument | null = await CloudDocument.findById(req.params.id)

            if (!document || document.deleted) {
                return res.status(404).json({ message: "Document not found" })
            }

            if (document.ownerId !== req.user?._id) {
                return res.status(403).json({ message: "Only the owner can revoke access" })
            }

            const targetUser: IUser | null = await User.findOne({ username: req.body.username })

            if (!targetUser) {
                return res.status(404).json({ message: "User not found" })
            }

            if (targetUser._id.toString() === req.user?._id) {
                return res.status(400).json({ message: "cannot revoke from yourself" })
            }

            if (!document.editorIds.includes(targetUser._id.toString())) {
                return res.status(400).json({ message: "already doesn't have access" })
            }

            document.editorIds = document.editorIds.filter((editorId) => editorId !== targetUser._id.toString())
            await document.save()

            return res.status(200).json(document)

        } catch (error: any) {
            console.error(error)
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
)

export default router