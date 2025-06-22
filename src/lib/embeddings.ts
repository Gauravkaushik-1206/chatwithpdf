import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });
    const result = await response.json();
    console.log("OpenAI embeddings response", result);
    return result.data[0].embedding as number[];
  } catch (error) {
    console.log("Error calling openAI embeddingss api", error);
    throw error;
  }
}

import { GoogleGenAI, ContentEmbedding } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function getGeminiEmbeddings(text: string) {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-exp-03-07",
      contents: text.replace(/\n/g, " "),
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 2048,
      },
    });

    // console.log("Embedding Response : ", response.embeddings);
    if (response.embeddings && response.embeddings.length > 0) {
      return response.embeddings[0].values as number[];
    } else {
      throw new Error("No embeddings returned from Gemini API");
    }
  } catch (error) {
    console.log("Error calling openAI embeddingss api", error);
    throw error;
  }
}
