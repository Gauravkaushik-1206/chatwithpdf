import { Pinecone } from '@pinecone-database/pinecone'
import { getPineconeClient } from './pineconedb';
import { convertToAscii } from './utils';
import { getGeminiEmbeddings } from './embeddings';

export async function getMatchsFromEmbeddings(embeddings: number[], fileKey: string){
    const client = new Pinecone({
        apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY || "",
    })

     const index = client.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME || "");

     try {
        const namespace = convertToAscii(fileKey);
        const queryResponse = await index.namespace(namespace).query({
            vector: embeddings,
            topK: 5,
            includeMetadata: true,
        });
        return queryResponse.matches || [];
     } catch (error) {
        console.log('error in getMatchsFromEmbeddings', error);
        throw error;
     }

}

export async function getContext(query: string, fileKey: string){
    const queryEmbeddings = await getGeminiEmbeddings(query);
    const matches = await getMatchsFromEmbeddings(queryEmbeddings, fileKey);
    if(!matches || matches.length === 0){
        return "No relevant context found.";
    }

    const qualifyingDocs = matches.filter((match)=>(
        match.score && match.score > 0.7
    ));

    type Metadata = {
        text:string,
        pageNumber: number
    }

    let docs = qualifyingDocs.map((match)=> (match.metadata as Metadata).text);
    return docs.join("\n").substring(0,3000);
}