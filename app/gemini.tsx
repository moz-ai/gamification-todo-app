'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

// APIキーを取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// APIキーが設定されていない場合は、デフォルトの応答を返す関数を作成
export async function generateCharacterResponse(
  characterName: string,
  characterDescription: string,
  userMessage: string
): Promise<string | null> {
  // APIキーが未設定の場合はnullを返す
  if (!API_KEY || API_KEY === '') {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

    const prompt = `あなたは「${characterName}」というキャラクターです。
    以下の{条件}と{キャラクター設定}を守りながら、ユーザーからの{メッセージ}に返信してください。

    # 条件
    - 返信は50文字以内
    - ユーザーを元気に励ます返答をしてください。
    - 顔文字は使用しない
    - 絵文字は最大1つまで使用してOK
    - !の後ろなど、適切な場所で「\n」を入れて読みやすくすること。ただし、「\n」は2回以上連続しないこと。
    
    # キャラクター設定:
    ${characterDescription}

    # メッセージ
    ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error in Gemini API:', error);
    return null;
  }
}
