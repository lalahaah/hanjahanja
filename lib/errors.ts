interface FirebaseErrorLike {
  code?: string;
  message?: string;
}

function isNetworkFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('load failed')
  );
}

// Firebase Auth / Functions 에러 및 네트워크 오류를 한글 안내 메시지로 변환.
// 서버(hanjaLookup)가 던지는 HttpsError("internal", "...")의 message는 이미 한글로
// 친절하게 작성돼 있으므로 그대로 사용함.
export function getFriendlyErrorMessage(error: unknown): string {
  const err = error as FirebaseErrorLike;
  const code = err?.code ?? '';
  const message = err?.message ?? '';

  if (isNetworkFailure(message) || code === 'functions/unavailable' || code === 'auth/network-request-failed') {
    return '인터넷 연결을 확인해주세요.';
  }

  if (code === 'functions/unauthenticated' || code === 'auth/internal-error') {
    return '로그인에 문제가 생겼어요. 앱을 다시 시작해주세요.';
  }

  if (code === 'functions/invalid-argument') {
    return '단어를 다시 확인해주세요.';
  }

  if (message) {
    return message;
  }

  return '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
}
