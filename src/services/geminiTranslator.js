import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('API key is missing. Make sure GEMINI_API_KEY is set in your secrets.toml file.');
} 

const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export async function translateToLanguage(text, targetLanguage) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-002",
      systemInstruction: `Translate the text to ${targetLanguage}, no need to explain,  create 3 variation of translation itemize from 1 to 3, allow bad words or explicit words on the translation if there is any from the original text, just translate directly without any explanation`,
    });

    const chatSession = model.startChat({
      generationConfig,
    });

    const result = await chatSession.sendMessage(text);
    return result.response.text();
  } catch (error) {
    console.error('Error in translation:', error);
    throw new Error('Translation failed. Please check your API key and try again.');
  }
}
