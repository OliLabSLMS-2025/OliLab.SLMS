

import { GoogleGenAI, Type } from "@google/genai";
import { Item, LogEntry, User, InventoryReport } from '../types';

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY && process.env.API_KEY.trim() !== "") {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY environment variable not set or is empty. AI features will not work.");
}

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        overview: { type: Type.STRING, description: "A brief, encouraging overview of the lab's status." },
        lowStockItems: {
            type: Type.ARRAY,
            description: "Items where available quantity is less than 20% of total. If none, this should be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    available: { type: Type.INTEGER },
                    total: { type: Type.INTEGER },
                },
            },
        },
        recentActivity: {
            type: Type.ARRAY,
            description: "A summary of the 5 most recent borrow or return activities. If none, this should be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: { type: Type.STRING },
                    userName: { type: Type.STRING },
                    action: { type: Type.STRING, description: "Should be 'Borrowed' or 'Returned'."},
                    quantity: { type: Type.INTEGER },
                },
            },
        },
        mostActiveItems: {
            type: Type.ARRAY,
            description: "The top 3 most frequently borrowed items. If none, this should be an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    borrowCount: { type: Type.INTEGER },
                },
            },
        },
        conclusion: { type: Type.STRING, description: "A positive and forward-looking concluding statement." },
    },
};

export const generateInventoryReport = async (items: Item[], logs: LogEntry[], users: User[]): Promise<InventoryReport> => {
  if (!ai) {
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable to use this feature.");
  }

  const prompt = `
    Analyze the following laboratory data and generate a concise inventory status report.
    - Identify items with low stock (available quantity is less than 20% of total).
    - Summarize the 5 most recent activities.
    - Find the top 3 most borrowed items.
    - Provide a brief overview and conclusion.

    **JSON Data:**
    *   **Inventory:** ${JSON.stringify(items)}
    *   **Logs:** ${JSON.stringify(logs.slice(0, 50))}
    *   **Users:** ${JSON.stringify(users.map(u => ({id: u.id, fullName: u.fullName})))}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: reportSchema,
        },
    });
    
    // FIX: The response from the Gemini API is a string that needs to be parsed into a JSON object.
    const jsonText = response.text;
    return JSON.parse(jsonText) as InventoryReport;

  } catch (error) {
    console.error("Error generating report:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the AI's response. The format was invalid.");
    }
    throw error;
  }
};
