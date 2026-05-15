import {
    createDocumentsController,
    getIdByDocument,
    getAllDocumentsController,
    updateDocumentController,
    deleteDocumentController,
    downloadDocumentSK,
    downloadDocumentSR,
    downloadDocumentSS
} from "../controller/document.controller.js"

export default async function documentRoutes(app) {
    //create
    app.post('/create', createDocumentsController)
    //read
    app.get('/show/:id', getIdByDocument)
    app.get('/show', getAllDocumentsController)
    //update
    app.put('/update/:id', updateDocumentController)
    //delete
    app.delete('/delete/:id', deleteDocumentController)
    //download
    app.get('/download/sk/:id', downloadDocumentSK)
    app.get('/download/sr/:id', downloadDocumentSR)
    app.get('/download/ss/:id', downloadDocumentSS)
}