
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessSchedule, CommandType } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * VoiceCommandParser utilizes Gemini API to transform natural language voice transcripts
 * into structured business scheduling commands.
 */
export class VoiceCommandParser {
  appName: string;

  constructor(appName: string) {
    this.appName = appName;
  }

  /**
   * Processes voice input using Gemini 3 Pro to accurately extract intent and schedule details.
   */
  public async parseAndExecute(spokenText: string, currentYear: number): Promise<{ schedule?: BusinessSchedule, type: CommandType, message: string } | null> {
    // 1. Initial trigger check
    if (!spokenText.startsWith(this.appName)) {
      return null; 
    }

    // 2. Initialize Gemini client using process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // 3. Query Gemini for structured extraction
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
              date: { type: Type.STRING, description: "ISO date YYYY-MM-DD" },
              startTime: { type: Type.STRING, description: "ISO date-time or null" },
              endTime: { type: Type.STRING, description: "ISO date-time or null" },
              message: { type: Type.STRING, description: "Korean response for the user" }
            },
            required: ["type", "title", "message"]
          }
        }
      });

      // 4. Parse response using the .text property (not a method)
      const data = JSON.parse(response.text || '{}');
      const command = data.type as CommandType;

      if (command === CommandType.Add) {
        const startTime = data.startTime ? new Date(data.startTime) : null;
        // Default duration is 1 hour if not specified
        const endTime = data.endTime ? new Date(data.endTime) : (startTime ? new Date(startTime.getTime() + 60 * 60 * 1000) : null);

        const newSchedule: BusinessSchedule = {
          id: uuidv4(),
          title: data.title || "새로운 회의",
          date: new Date(data.date || new Date()),
          startTime,
          endTime,
          isReminded: true,
          remindBeforeMinutes: 60,
          enableVibration: true,
          enableSound: true,
          enablePopup: true,
          soundFileName: 'business_alert_1.mp3'
        };
        
        return {
          schedule: newSchedule,
          type: CommandType.Add,
          message: data.message
        };
      }

      // Handle Delete/Modify as placeholder messages until full logic is integrated in UI
      return {
        type: command,
        message: data.message
      };
    } catch (error) {
      console.error("Gemini processing failed", error);
      return {
        type: CommandType.Add,
        message: "죄송합니다. 음성 명령을 이해하는 데 실패했습니다. 다시 말씀해 주세요."
      };
    }
  }
}
