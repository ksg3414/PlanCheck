
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessSchedule, CommandType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class VoiceCommandParser {
  appName: string;

  constructor(appName: string) {
    this.appName = appName;
  }

  public async parseAndExecute(spokenText: string, currentYear: number): Promise<{ schedule?: BusinessSchedule, type: CommandType, message: string } | null> {
    if (!spokenText.startsWith(this.appName)) {
      return null; 
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          You are a virtual assistant for a scheduling app called "${this.appName}".
          Current Year: ${currentYear}
          Reference Timestamp: ${new Date().toISOString()}

          Extract schedule information from the user's voice command: "${spokenText}"

          Requirements:
          1. Determine the intent: "Add", "Delete", or "Modify".
          2. Extract the event title.
          3. Extract date (YYYY-MM-DD).
          4. Extract start/end times if mentioned.
          5. Generate a friendly Korean confirmation message.

          Output the result strictly as a valid JSON object.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["Add", "Delete", "Modify"] },
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["type", "title", "message"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const command = data.type as CommandType;

      if (command === CommandType.Add) {
        const startTime = data.startTime ? new Date(data.startTime) : null;
        const endTime = data.endTime ? new Date(data.endTime) : (startTime ? new Date(startTime.getTime() + 60 * 60 * 1000) : null);

        const newSchedule: BusinessSchedule = {
          id: uuidv4(),
          title: data.title || "새로운 일정",
          date: new Date(data.date || new Date()),
          startTime,
          endTime,
          isReminded: true,
          remindBeforeMinutes: 10,
          enableVibration: true,
          enableSound: true,
          enablePopup: true
        };
        
        return {
          schedule: newSchedule,
          type: CommandType.Add,
          message: data.message
        };
      }

      return {
        type: command,
        message: data.message
      };
    } catch (error) {
      console.error("Gemini processing failed", error);
      return {
        type: CommandType.Add,
        message: "죄송합니다. 음성 명령을 처리하지 못했습니다."
      };
    }
  }
}
