import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface HanjaInfo {
  char: string;
  sound: string;
  meaning: string;
}

interface HanjaLookupResponse {
  word: string;
  hanja: HanjaInfo[];
  explanation: string;
}

const RETRYABLE_STATUS_CODES = [429, 503];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini가 일시적으로 과부하(503)이거나 rate limit(429)일 때 짧게 재시도
async function fetchGeminiWithRetry(
  url: string,
  body: string,
  maxAttempts = 3
): Promise<Response> {
  let lastResponse: Response | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok || !RETRYABLE_STATUS_CODES.includes(res.status)) {
      return res;
    }

    lastResponse = res;
    if (attempt < maxAttempts) {
      logger.warn(
        `Gemini API returned ${res.status}, retrying (${attempt}/${maxAttempts - 1})`
      );
      await sleep(attempt * 800);
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
    { "char": "한자글자", "sound": "음", "meaning": "훈/뜻풀이" }
  ],
  "explanation": "초등학생이 이해할 수 있는 쉬운 단어 풀이 문장"
}
`.trim();

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

      const res = await fetchGeminiWithRetry(
        geminiUrl,
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
        const friendlyMessage = RETRYABLE_STATUS_CODES.includes(res.status)
          ? "지금 사용자가 많아 응답이 늦어지고 있어요. 잠시 후 다시 시도해주세요."
          : `한자 풀이를 가져오지 못했어요 (상태 코드: ${res.status})`;
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
