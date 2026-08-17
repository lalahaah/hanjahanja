import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface HanjaInfo {
  char: string;
  sound: string;
  meaning: string;
  origin: string;
}

interface RelatedWord {
  word: string;
  meaning: string;
}

interface Idiom {
  idiom: string;
  meaning: string;
}

interface HanjaLookupResponse {
  word: string;
  hanja: HanjaInfo[];
  explanation: string;
  example: string;
  relatedWords: RelatedWord[];
  idioms: Idiom[];
}

// 503(일시적 과부하)만 재시도. 429는 대부분 할당량(quota) 초과라 재시도해도 소용없음 —
// 자세한 원인은 로그의 errorText로 확인 (예: "limit: 0"이면 그 모델에 대한 권한 자체가 없는 것)
const OVERLOADED_STATUS = 503;
const MODEL = "gemini-flash-latest";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGeminiWithRetry(
  apiKey: string,
  body: string,
  maxAttempts = 3
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  let lastResponse: Response | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok || res.status !== OVERLOADED_STATUS) {
      return res;
    }

    lastResponse = res;
    if (attempt < maxAttempts) {
      logger.warn(`Gemini API overloaded (503), retrying (${attempt}/${maxAttempts - 1})`);
      await sleep(attempt * 1000);
    }
  }
  return lastResponse!;
}

export const hanjaLookup = onCall(
  { secrets: [geminiApiKey] },
  async (request): Promise<HanjaLookupResponse> => {
    // 1. 인증 확인 (request.auth 존재 여부 검사)
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }

    // 2. 입력 파라미터 검증 (word 필수 및 비어있지 않은 문자열)
    const word = request.data?.word;
    if (!word || typeof word !== "string" || word.trim() === "") {
      throw new HttpsError(
        "invalid-argument",
        "word 파라미터가 유효하지 않거나 비어 있습니다."
      );
    }

    // 3. API 키 읽기 (Secret Manager)
    const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not set in secrets or environment");
      throw new HttpsError(
        "internal",
        "서버 설정 오류: GEMINI_API_KEY가 설정되지 않았증습니다."
      );
    }

    // 4. Gemini 프롬프트 작성
    const prompt = `
당신은 초등학생을 위한 친절한 한자 풀이 선생님입니다.
제시된 한글 단어 "${word.trim()}"를 구성하는 한자와 그 뜻을 풀이해주세요.

반드시 다른 설명 없이 아래의 JSON 구조로만 응답해주세요:
{
  "word": "${word.trim()}",
  "hanja": [
    {
      "char": "한자글자",
      "sound": "음",
      "meaning": "훈/뜻풀이",
      "origin": "이 한자가 어떤 모습/상황에서 만들어졌는지 초등학생이 흥미를 느낄 만한 유래 이야기 (2~3문장)"
    }
  ],
  "explanation": "초등학생이 이해할 수 있는 쉬운 단어 풀이 문장",
  "example": "이 단어를 사용한 자연스러운 예문 한 문장 (초등학생 눈높이)",
  "relatedWords": [
    { "word": "같은 한자를 포함하는 다른 단어", "meaning": "그 단어의 짧은 뜻풀이" }
  ],
  "idioms": [
    { "idiom": "이 단어의 한자를 포함하는 사자성어", "meaning": "사자성어의 쉬운 뜻풀이" }
  ]
}

규칙:
- relatedWords는 2~3개, 초등학생이 알 만한 실생활 단어로 골라주세요.
- idioms는 해당 한자를 포함하는 사자성어가 있으면 1~2개, 적절한 것이 없으면 빈 배열 []로 응답하세요. 억지로 만들어내지 마세요.
`.trim();

    try {
      const res = await fetchGeminiWithRetry(
        apiKey,
        JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        })
      );

      if (!res.ok) {
        const errorText = await res.text();
        logger.error("Gemini API call failed", {
          status: res.status,
          errorText: errorText.substring(0, 500),
        });
        let friendlyMessage = `한자 풀이를 가져오지 못했어요 (상태 코드: ${res.status})`;
        if (res.status === OVERLOADED_STATUS) {
          friendlyMessage = "지금 사용자가 많아 응답이 늦어지고 있어요. 잠시 후 다시 시도해주세요.";
        } else if (res.status === 429) {
          friendlyMessage = "오늘 사용량이 많아 잠시 이용이 제한됐어요. 잠시 후 다시 시도해주세요.";
        }
        throw new HttpsError("internal", friendlyMessage);
      }

      const responseData = await res.json();
      const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        logger.error("Gemini API returned empty text part", { responseData });
        throw new HttpsError(
          "internal",
          "Gemini로부터 유효한 응답 텍스트를 받지 못했습니다."
        );
      }

      // 5. JSON 파싱 및 응답 반환
      try {
        const parsed: HanjaLookupResponse = JSON.parse(rawText);
        return parsed;
      } catch (parseError) {
        logger.error("Failed to parse JSON response from Gemini", {
          rawTextSnippet: rawText.substring(0, 500),
          error: parseError,
        });
        throw new HttpsError(
          "internal",
          "Gemini 응답을 JSON으로 파싱하는 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("Unexpected error in hanjaLookup function", { error });
      throw new HttpsError(
        "internal",
        "한자 풀이 처리 중 오류가 발생했습니다."
      );
    }
  }
);
