import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;

if (!apiKey) {
    // console.warn("PINECONE_API_KEY is not set. Vector search will be disabled.");
}

export const pinecone = apiKey ? new Pinecone({ apiKey }) : null;

export const indexName = "vibebite-recipes";

export async function getIndex() {
    if (!pinecone) return null;
    return pinecone.index(indexName);
}
