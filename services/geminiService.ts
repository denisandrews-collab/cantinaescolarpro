import { GoogleGenAI } from "@google/genai";
import { CartItem } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateReceiptMessage = async (studentName: string, items: CartItem[]): Promise<string> => {
  // Graceful fallback if no API key is present
  if (!API_KEY) {
    return "Obrigado pela preferência! Bom apetite.";
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    const itemNames = items.map(item => item.name).join(', ');
    
    // Using flash model for speed
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, friendly, and encouraging message (max 15 words) in Portuguese for a student named ${studentName} who just bought: ${itemNames}. If the food is healthy, compliment them. If it's a treat, tell them to enjoy it. Do not use quotes.`,
    });

    return response.text || "Tenha um excelente dia de estudos!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bom apetite e bons estudos!";
  }
};