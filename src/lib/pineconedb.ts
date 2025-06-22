import { Pinecone } from "@pinecone-database/pinecone";
import { downloadS3File } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings, getGeminiEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;

export function getPineconeClient() {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY || "",
    });
  }
  return pinecone;
}

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(file_key: string) {
  //1. obtain the pdf -> download and read form pdf
  console.log("downloading s3 into file system");
  const file_name = await downloadS3File(file_key);
  if (!file_name) {
    throw new Error("Failed to download file from S3");
  }
  const loader = new PDFLoader(file_name);

  const docs = (await loader.load()) as PDFPage[];

  //2. split and segment the pdf
  const documents = await Promise.all(docs.map(prepareDocumnet));

  //3. vectorise and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  //4. upload to pineconedb
  const client = getPineconeClient();
  const index = client.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME || "");

  console.log("Uploading vectors to Pinecone...");

  const namespace = convertToAscii(file_key);

  const chunks = (array:any, batchSize = 200) => {
    const chunks = [];

    for (let i = 0; i < array.length; i += batchSize) {
      chunks.push(array.slice(i, i + batchSize));
    }

    return chunks;
  };

  const recordChunks = chunks(vectors, 10);

  await Promise.all(recordChunks.map((chunk) => index.namespace(namespace).upsert(chunk)));

  return documents[0];

  //--------------------------------------------------------------------------------------------------------------------

  // const flatDocs = documents.flat();
  //3. Prepare records for Pineconde upsert ( raw text, no embeddings)
  // const records = flatDocs.map((doc: any) => ({
  //   id: md5(doc.pageContent),
  //   chunk_text: doc.pageContent,
  //   category: "pdf",
  // }));

  // 4. Upsert to Pinecone using built-in embedding model
  // const client = getPineconeClient();
  // const indexName = process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME || "";
  // const indexHost = process.env.NEXT_PUBLIC_PINECONE_INDEX_HOST || ""; // You must set this in your env
  // const namespaceStr = convertToAscii(file_key);

  // const namespace = client.index(indexName).namespace(namespaceStr);

  // Upsert in batches
  // const batchSize = 10;
  // for (let i = 0; i < records.length; i += batchSize) {
  //   const batch = records.slice(i, i + batchSize);
  //   try{
  //     await namespace.upsert(batch);
  //   }catch(error){
  //     console.log("error while Upserting ",error)
  //     break;
  //   }
  // }

  // return flatDocs[0];
}

async function embedDocument(doc: Document) {
  try {
    // const embeddings = await getEmbeddings(doc.pageContent);
    const embeddings = await getGeminiEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        pageNumber: doc.metadata.pageNumber,
        text: doc.metadata.text,
      },
    };
  } catch (error) {
    console.error("Error embedding document:", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocumnet(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  //split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
