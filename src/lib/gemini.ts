import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use current stable model "gemini-2.5-flash" (June 2025)
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
export const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function embedText(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
}

export async function generateContent(prompt: string): Promise<string> {
    const model = geminiModel;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
}
