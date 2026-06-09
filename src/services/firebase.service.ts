import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GeminiService } from "./gemini.service.js";

// Winner item definition
interface WinnerDoc {
  id: string;
  type: "hook" | "ad" | "angle" | "campaign";
  content: any;
  metadata: Record<string, any>;
  embedding: number[];
  createdAt: string;
}

// In-memory fallback database
const inMemoryDb: WinnerDoc[] = [];

let isFirestoreEnabled = false;
let db: admin.firestore.Firestore | null = null;

try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountVar);
    } catch (e) {
      // In case it's a base64 encoded string
      credentials = JSON.parse(Buffer.from(serviceAccountVar, "base64").toString("utf-8"));
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
    db = getFirestore();
    isFirestoreEnabled = true;
    console.log("[FirebaseService] Successfully initialized Firestore with service account.");
  } else {
    console.warn("[FirebaseService] No FIREBASE_SERVICE_ACCOUNT found. Running in mockup in-memory mode.");
  }
} catch (error) {
  console.error("[FirebaseService] Failed to initialize Firebase Admin SDK:", error);
  console.warn("[FirebaseService] Falling back to in-memory mode.");
}

// Cosine similarity helper for in-memory semantic search
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class FirebaseService {
  /**
   * Saves a winning asset to Firestore (or in-memory fallback).
   */
  static async saveWinner(type: "hook" | "ad" | "angle" | "campaign", content: any, metadata: Record<string, any>) {
    // Generate text representation for embedding
    const contentText = typeof content === "string" 
      ? content 
      : JSON.stringify(content);
    
    const metadataText = Object.entries(metadata)
      .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
      .join(", ");
    
    const textToEmbed = `Type: ${type}\nContent: ${contentText}\nMetadata: ${metadataText}`;
    
    // Get vector embedding
    console.log("[FirebaseService] Generating embedding for winning campaign...");
    const embedding = await GeminiService.getEmbedding(textToEmbed);

    const docId = db ? db.collection("winners").doc().id : `win_${Math.random().toString(36).substring(2, 11)}`;
    const newDoc: WinnerDoc = {
      id: docId,
      type,
      content,
      metadata,
      embedding,
      createdAt: new Date().toISOString(),
    };

    if (isFirestoreEnabled && db) {
      try {
        const docRef = db.collection("winners").doc(docId);
        
        // Use standard or vector field depending on Admin SDK support
        const writeData: any = {
          type: newDoc.type,
          content: newDoc.content,
          metadata: newDoc.metadata,
          createdAt: newDoc.createdAt,
        };

        // Inject vector representation in Firestore format
        try {
          writeData.embedding = FieldValue.vector(embedding);
        } catch (err) {
          // Fallback if FieldValue.vector is not available in local version
          writeData.embedding = embedding;
        }

        await docRef.set(writeData);
        console.log(`[FirebaseService] Saved winner to Firestore: ${docId}`);
        return { success: true, id: docId, mode: "firestore" };
      } catch (error) {
        console.error("[FirebaseService] Error saving to Firestore, saving to in-memory fallback:", error);
      }
    }

    // Fallback in-memory save
    inMemoryDb.push(newDoc);
    console.log(`[FirebaseService] Saved winner to in-memory DB: ${docId}`);
    return { success: true, id: docId, mode: "in-memory" };
  }

  /**
   * Retrieves winners with semantic search and metadata filtering.
   */
  static async retrieveWinners(query?: string, filters: Record<string, any> = {}, limit: number = 10) {
    let queryEmbedding: number[] | null = null;
    
    if (query) {
      console.log(`[FirebaseService] Generating embedding for search query: "${query}"`);
      queryEmbedding = await GeminiService.getEmbedding(query);
    }

    if (isFirestoreEnabled && db) {
      try {
        const collectionRef = db.collection("winners");
        let queryRef: admin.firestore.Query = collectionRef;

        // Apply metadata filters
        for (const [key, val] of Object.entries(filters)) {
          if (key === "type") {
            queryRef = queryRef.where("type", "==", val);
          } else {
            // Check in metadata map
            queryRef = queryRef.where(`metadata.${key}`, "==", val);
          }
        }

        // Perform vector query or standard query
        if (queryEmbedding) {
          try {
            const vectorQuery = queryRef.findNearest(
              "embedding",
              FieldValue.vector(queryEmbedding),
              {
                limit,
                distanceMeasure: "COSINE",
              }
            );
            const snapshot = await vectorQuery.get();
            const results = snapshot.docs.map(doc => {
              const data = doc.data();
              // Clean out the vector object representation for JSON compatibility
              delete data.embedding;
              return { id: doc.id, ...data };
            });
            console.log(`[FirebaseService] Retrieved ${results.length} results via Firestore Vector Search`);
            return results;
          } catch (vectorErr) {
            console.warn("[FirebaseService] Firestore vector search failed or index missing. Falling back to metadata query:", (vectorErr as Error).message);
            // Fall back to standard query without similarity ranking
            const snapshot = await queryRef.limit(limit).get();
            const results = snapshot.docs.map(doc => {
              const data = doc.data();
              delete data.embedding;
              return { id: doc.id, ...data };
            });
            return results;
          }
        } else {
          // Standard query
          const snapshot = await queryRef.limit(limit).get();
          const results = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.embedding;
            return { id: doc.id, ...data };
          });
          return results;
        }
      } catch (error) {
        console.error("[FirebaseService] Error querying Firestore, falling back to in-memory query:", error);
      }
    }

    // In-memory query logic (performs filtration and cosine similarity ranking)
    let filtered = [...inMemoryDb];

    // Apply filters
    for (const [key, val] of Object.entries(filters)) {
      filtered = filtered.filter(item => {
        if (key === "type") {
          return item.type === val;
        }
        return item.metadata[key] === val;
      });
    }

    // Apply semantic similarity ranking if query present
    if (queryEmbedding) {
      const qEmbed = queryEmbedding;
      const scored = filtered.map(item => {
        const score = cosineSimilarity(item.embedding, qEmbed);
        return { item, score };
      });
      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);
      filtered = scored.map(s => ({
        ...s.item,
        distance: 1 - s.score // distance is cosine distance (1 - similarity)
      }));
    }

    // Format output (strip embedding array to save payload bandwidth)
    const results = filtered.slice(0, limit).map(item => {
      const doc = { ...item } as any;
      delete doc.embedding;
      return doc;
    });

    console.log(`[FirebaseService] Retrieved ${results.length} results via in-memory query`);
    return results;
  }
}
