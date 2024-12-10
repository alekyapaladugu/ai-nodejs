import {openai} from './openai.js'
import { OpenAIEmbeddings } from '@langchain/openai'
import {Document} from 'langchain/document'
import {MemoryVectorStore} from 'langchain/vectorstores/memory'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import  {PDFLoader} from "@langchain/community/document_loaders/fs/pdf";
import {YoutubeLoader} from "@langchain/community/document_loaders/web/youtube";



const question = process.argv[2] || 'hi'
const video = `https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn`

const createStore =  (docs) => 
     MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())


const docsFromYTVideo = async(video) => {
    const loader = YoutubeLoader.createFromUrl(video, {
        language: 'en',
        addVideoInfo: true,
    })
    // loader converts the video into a document by taking in chunks of text form youtube. 
    //The whole video is split into chunks of 2500 characters with 100 characters overlap for better context to give it to the model.
    // Instead of giving the whole video to the model, it is split into chunks to give the model better context.
    const splitter = new CharacterTextSplitter({
        separator: ' ',           // Split chunks by spaces
        chunkSize: 2500,          // Maximum characters per chunk
        chunkOverlap: 100,        // Overlap size for better context
    });

     // Load and split the video transcript into chunks
     const rawDocuments = await loader.load()
     const documents = await splitter.splitDocuments(rawDocuments);
     return documents;
}

const docsFromPDF = async () => {
    const loader = new PDFLoader('xbox.pdf')
    const splitter = new CharacterTextSplitter({
        separator: '. ',           // Split chunks by spaces
        chunkSize: 2500,          // Maximum characters per chunk
        chunkOverlap: 200,        // Overlap size for better context
    });

    // Load and split the pdf into chunks
    const rawDocuments = await loader.load()
    const documents = await splitter.splitDocuments(rawDocuments);
    return documents;
}

const loadStore = async () => {
    const videoDocs = await docsFromYTVideo(video)
    const pdfDocs = await docsFromPDF()
    return createStore([ ...videoDocs, ...pdfDocs])
}

const query = async () => {
    const store = await loadStore()
    const results = await store.similaritySearch(question, 2)
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI assistant. Answser questions to your best ability.',
            },
            {
              role: 'user',
              content: `Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff.
              Just say you need more context.
              Question: ${question}
        
              Context: ${results.map((r) => r.pageContent).join('\n')}`,
            },
          ],
    })
    console.log(
        `Answer: ${response.choices[0].message.content}\n\nSources: ${results
          .map((r) => r.metadata.source)
          .join(', ')}`
      )
}

query()