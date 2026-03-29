exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { region, fitness, purpose, companion } = JSON.parse(event.body || "{}");

  if (!region || !fitness || !purpose || !companion) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
  }

  const prompt = `당신은 대한민국 등산 전문 여행 큐레이터입니다.
아래 조건에 맞는 당일 등산 코스와 하산 후 맛집을 추천해주세요.

조건:
- 지역: ${region}
- 체력 수준: ${fitness}
- 목적: ${purpose}
- 동행: ${companion}

반드시 아래 JSON 구조로만 응답하세요. 마크다운 코드블록이나 다른 텍스트는 절대 포함하지 마세요.

{"mountain":"산 이름","tagline":"이 코스를 한 문장으로","overview":"코스 전체 소개 2~3문장","distance":"예: 5.8km","duration":"예: 3시간 30분","difficulty":"초급/중급/고급 중 하나","trail":[{"name":"구간명","desc":"50자 이내 설명"},{"name":"구간명","desc":"설명"},{"name":"구간명","desc":"설명"},{"name":"구간명","desc":"설명"}],"restaurants":[{"emoji":"🍲","name":"식당명","menu":"대표 메뉴","note":"한 줄 설명","tag":"가성비"},{"emoji":"🍜","name":"식당명","menu":"대표 메뉴","note":"한 줄 설명","tag":"현지 맛집"},{"emoji":"☕","name":"카페 또는 식당명","menu":"대표 메뉴","note":"한 줄 설명","tag":"분위기 좋음"}],"tips":["팁1","팁2","팁3"]}`;

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const status = response.status;
    let errorMessage = err.error?.message || "API 오류";
    if (status === 429) errorMessage = "RATE_LIMIT";
    if (status === 400) errorMessage = "API 키가 올바르지 않아요.";
    return { statusCode: status, body: JSON.stringify({ error: errorMessage }) };
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/^```[\w]*\s*/, "").replace(/\s*```$/, "").trim();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: clean,
  };
};
```

붙여넣기 후 **"Commit changes"** 클릭하면 완료예요!

그러면 GitHub에 파일이 이렇게 3개 올라가 있어야 해요:
```
hiking-planner/
├── index.html
├── netlify.toml
└── functions/
    └── generate.js
