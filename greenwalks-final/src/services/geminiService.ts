import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface EcoSuggestion {
  type: 'WALK' | 'CYCLE' | 'TRANSIT';
  description: string;
  co2Savings: number;
  xpReward: number;
  originalTripDesc: string;
}

export async function getEcoSuggestions(userActivityHistory: string[]): Promise<EcoSuggestion[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given the user trip history: ${userActivityHistory.join(', ')}, suggest 3 eco-friendly alternatives. 
      Focus on replacing car trips with walking or cycling.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['WALK', 'CYCLE', 'TRANSIT'] },
              description: { type: Type.STRING },
              co2Savings: { type: Type.NUMBER },
              xpReward: { type: Type.NUMBER },
              originalTripDesc: { type: Type.STRING }
            },
            required: ['type', 'description', 'co2Savings', 'xpReward', 'originalTripDesc']
          }
        }
      }
    });

    const text = response.text || '[]';
    // Remove potential markdown code blocks
    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson || '[]');
  } catch (error: any) {
    console.error('Gemini error:', error);
    // Fallback suggestions if Gemini fails (e.g. Quota Exceeded)
    return [
      {
        type: 'WALK',
        description: 'Try walking for short errands under 1km',
        co2Savings: 150,
        xpReward: 50,
        originalTripDesc: 'Short local drive'
      },
      {
        type: 'CYCLE',
        description: 'Swap your commute for a bike ride twice a week',
        co2Savings: 450,
        xpReward: 120,
        originalTripDesc: 'Commuter drive'
      }
    ];
  }
}

export async function getSustainabilityTip(): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a short, inspiring sustainability tip for an eco-friendly travel app. Keep it under 20 words.",
    });
    return response.text?.trim() || "Every step counts towards a greener planet!";
  } catch (error) {
    return "Every step counts towards a greener planet!";
  }
}
