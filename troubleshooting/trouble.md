API 라우트 호출됨
요청 데이터: {
  hasRoute: true,
  settings: { genre: 'mystery', style: 'first_person' },
  locationIndex: 0,
  previousChoicesCount: 0
}
Gemini API 키 존재 여부: true
GeminiProvider 생성 중...
AI 질문 생성 시작...
장소 정보: {
  customName: '마니산',
  address: '대한민국 인천광역시 마니산',
  description: '마니산에서 귀신을 토벌하던 중,  전화가 왔다. 그곳에 누구도 퇴치할 수 없다는 귀신이 있다는 전화 말이다.',
  storyHint: '신비로운 일이 일어났던 곳',
  genre: 'mystery'
}
GeminiProvider: 프롬프트 생성 중...
GeminiProvider: 생성된 프롬프트 길이: 800
GeminiProvider: 프롬프트 내용: mystery 장르의 인터랙티브 소설을 위한 질문과 선택지를 마크다운 형식으로 생성해주세요.

## 📍 현재 장소
**마니산**
- 시간: 2025. 7. 9. 오후 10:10:41
- 설명: 마니산에서 귀신을 토벌하던 중,  전화가 왔다. 그곳에 누구도 퇴치할 수 없다는 귀신이 있다는 전화 말이다.
- 힌트: 신비로운 일이 일어났던 곳

## 📋 마크다운 형식 (필수)

```markdown
### 🔍 [상황 제목]

> **질문**: [구체적인 선택 상황]

*[분위기나 추가 맥락 설명]*

**당신의 선택은?**

1. **[선택 1 제목]** - *[결과 힌트]*
2. **[선택 2 제목]** - *[결과 힌트]*
3. **[선택 3 제목]** - *[결과 힌트]*
```

## ✅ 체크리스트
- [ ] 질문은 > 인용문으로 시작
- [ ] 선택지 제목은 **굵은 글씨**
- [ ] 결과 설명은 *이탤릭체*
- [ ] mystery 장르 특성 반영
- [ ] 정확히 3개의 선택지
- [ ] 각 선택지는 구체적인 행동

## 🎯 작성 예시

### 🔍 비밀의 문 앞에서

> **질문**: 오래된 마니산에서 숨겨진 문을 발견했습니다. 어떻게 하시겠습니까?

*낡은 문에서 이상한 빛이 새어 나오고 있습니다.*

**당신의 선택은?**

1. **조심스럽게 문을 열어본다** - *미지의 세계로 첫발을 내딛는다*
2. **주변을 더 조사한다** - *단서를 찾아 신중하게 접근한다*
3. **다른 사람을 찾아간다** - *도움을 요청하거나 정보를 얻는다*

---

위 예시와 같은 형식으로 작성해주세요.
GeminiProvider: Gemini 모델 초기화...
GeminiProvider: Gemini API 호출 시작...
API 라우트 호출됨
요청 데이터: {
  hasRoute: true,
  settings: { genre: 'mystery', style: 'first_person' },
  locationIndex: 0,
  previousChoicesCount: 0
}
Gemini API 키 존재 여부: true
GeminiProvider 생성 중...
AI 질문 생성 시작...
장소 정보: {
  customName: '마니산',
  address: '대한민국 인천광역시 마니산',
  description: '마니산에서 귀신을 토벌하던 중,  전화가 왔다. 그곳에 누구도 퇴치할 수 없다는 귀신이 있다는 전화 말이다.',
  storyHint: '신비로운 일이 일어났던 곳',
  genre: 'mystery'
}
GeminiProvider: 프롬프트 생성 중...
GeminiProvider: 생성된 프롬프트 길이: 800
GeminiProvider: 프롬프트 내용: mystery 장르의 인터랙티브 소설을 위한 질문과 선택지를 마크다운 형식으로 생성해주세요.

## 📍 현재 장소
**마니산**
- 시간: 2025. 7. 9. 오후 10:10:41
- 설명: 마니산에서 귀신을 토벌하던 중,  전화가 왔다. 그곳에 누구도 퇴치할 수 없다는 귀신이 있다는 전화 말이다.
- 힌트: 신비로운 일이 일어났던 곳

## 📋 마크다운 형식 (필수)

```markdown
### 🔍 [상황 제목]

> **질문**: [구체적인 선택 상황]

*[분위기나 추가 맥락 설명]*

**당신의 선택은?**

1. **[선택 1 제목]** - *[결과 힌트]*
2. **[선택 2 제목]** - *[결과 힌트]*
3. **[선택 3 제목]** - *[결과 힌트]*
```

## ✅ 체크리스트
- [ ] 질문은 > 인용문으로 시작
- [ ] 선택지 제목은 **굵은 글씨**
- [ ] 결과 설명은 *이탤릭체*
- [ ] mystery 장르 특성 반영
- [ ] 정확히 3개의 선택지
- [ ] 각 선택지는 구체적인 행동

## 🎯 작성 예시

### 🔍 비밀의 문 앞에서

> **질문**: 오래된 마니산에서 숨겨진 문을 발견했습니다. 어떻게 하시겠습니까?

*낡은 문에서 이상한 빛이 새어 나오고 있습니다.*

**당신의 선택은?**

1. **조심스럽게 문을 열어본다** - *미지의 세계로 첫발을 내딛는다*
2. **주변을 더 조사한다** - *단서를 찾아 신중하게 접근한다*
3. **다른 사람을 찾아간다** - *도움을 요청하거나 정보를 얻는다*

---

위 예시와 같은 형식으로 작성해주세요.
GeminiProvider: Gemini 모델 초기화...
GeminiProvider: Gemini API 호출 시작...
GeminiProvider: API 응답 수신됨
GeminiProvider: 응답 내용 길이: 1266
GeminiProvider: 응답 내용 일부: ### 🔍 수상한 전화

> **질문**: 마니산 정상에서 누군가 당신에게 전화를 걸어 마을에 누구도 퇴치할 수 없는 귀신이 있다고 알려왔습니다.  전화 너머의 목소리는 떨리고 불안에 찬 듯합니다. 어떻게 하시겠습니까?

*밤하늘은 별 하나 없이 칠흑 같은 어둠에 잠겨 있고, 멀리서 개짖는 소리가 간헐적으로 들려옵니다.*

**당신의 선택은?**

1. 
🔍 [Gemini] 파싱 시작: {
  responseLength: 1266,
  linesCount: 23,
  firstFewLines: [
    '### 🔍 수상한 전화',
    '> **질문**: 마니산 정상에서 누군가 당신에게 전화를 걸어 마을에 누구도 퇴치할 수 없는 귀신이 있다고 알려왔습니다.  전화 너머의 목소리는 떨리고 불안에 찬 듯합니다. 어떻게 하시겠습니까?',
    '*밤하늘은 별 하나 없이 칠흑 같은 어둠에 잠겨 있고, 멀리서 개짖는 소리가 간헐적으로 들려옵니다.*',
    '**당신의 선택은?**',
    '1. **전화의 내용을 더 자세히 캐묻는다.** - *전화의 발신자와 귀신에 대한 정보를 얻을 수 있을지도 모릅니다.*'
  ]
}
✅ [Gemini] 질문 파싱 성공: 마니산 정상에서 누군가 당신에게 전화를 걸어 마을에 누구도 퇴치할 수 없는 귀신이 있다고 알려왔습니다.  전화 너머의 목소리는 떨리고 불안에 찬 듯합니다. 어떻게 하시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_0',
  text: '전화의 내용을 더 자세히 캐묻는다.',
  description: '전화의 발신자와 귀신에 대한 정보를 얻을 수 있을지도 모릅니다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_1',
  text: '마을로 내려가 상황을 직접 확인한다.',
  description: '귀신의 존재 여부와 마을 사람들의 반응을 확인할 수 있습니다. 하지만 위험할 수도 있습니다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_2',
  text: '전화를 끊고 귀신 토벌을 계속한다.',
  description: '당초 목표였던 귀신 토벌을 완료하고 나중에 상황을 파악할 수 있습니다. 하지만 중요한 정보를 놓칠 수도 있습니다.'
}
✅ [Gemini] 질문 파싱 성공: 마을 입구에 도착했습니다. 마을은 고요하고, 집집마다 불빛이 꺼져 있습니다.  어두컴컴한 골목길 사이로 싸늘한 기운이 느껴집니다.  어디로 향하시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_3',
  text: '가장 가까운 집으로 가서 주민들에게 귀신에 대해 묻는다.',
  description: '주민들로부터 중요한 정보를 얻을 수 있을지도 모르지만, 위험할 수도 있습니다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_4',
  text: '마을을 둘러보며 단서를 찾는다.',
  description: '귀신의 흔적이나 다른 중요한 단서를 발견할 수 있을지도 모릅니다. 하지만 시간이 오래 걸릴 수 있습니다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_5',
  text: '안내판에 적힌 정보를 확인하고, 가장 큰 집으로 향한다.',
  description: '안내판에 적힌 정보가 귀신과 관련된 정보일 수 있습니다. 하지만 잘못된 정보일 가능성도 있습니다.'
}
✅ [Gemini] 질문 파싱 성공: 마을에서 가장 큰 집으로 향하던 중, 낡은 절을 발견했습니다. 절의 문은 활짝 열려 있고, 안에서 이상한 소리가 들려옵니다. 들어가 보시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_6',
  text: '조심스럽게 절 안으로 들어간다.',
  description: '절 안에서 귀신과 관련된 중요한 단서를 발견할 수 있을지도 모릅니다. 하지만 위험할 수도 있습니다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_7',
  text: '절을 피해서 다른 곳으로 이동한다.',
  description: '안전을 우선시하여 다른 곳을 탐색합니다. 하지만 중요한 단서를 놓칠 수도 있습니다.'
}
파싱된 선택지 수: 8개
선택지 1: 전화의 내용을 더 자세히 캐묻는다.
선택지 2: 마을로 내려가 상황을 직접 확인한다.
선택지 3: 전화를 끊고 귀신 토벌을 계속한다.
선택지 4: 가장 가까운 집으로 가서 주민들에게 귀신에 대해 묻는다.
선택지 5: 마을을 둘러보며 단서를 찾는다.
선택지 6: 안내판에 적힌 정보를 확인하고, 가장 큰 집으로 향한다.
선택지 7: 조심스럽게 절 안으로 들어간다.
선택지 8: 절을 피해서 다른 곳으로 이동한다.
GeminiProvider: 파싱 완료, 선택지 수: 8
AI 질문 생성 완료: {
  questionId: 'question_0',
  questionText: '마을에서 가장 큰 집으로 향하던 중, 낡은 절을 발견했습니다. 절의 문은 활짝 열려 있고, 안에서 이상한 소리가 들려옵니다. 들어가 보시겠습니까?',
  choicesCount: 8,
  firstChoice: '전화의 내용을 더 자세히 캐묻는다.'
}
 POST /api/ai/interactive-question 200 in 11848ms
GeminiProvider: API 응답 수신됨
GeminiProvider: 응답 내용 길이: 1182
GeminiProvider: 응답 내용 일부: ### 🔍 수상한 전화

> **질문**: 마니산 정상에서 귀신 토벌 중,  누구도 퇴치할 수 없다는 귀신에 대한 전화를 받았습니다.  어떻게 하시겠습니까?

*밤하늘은 칠흑처럼 어둡고, 바람은 차갑게 귓가를 스칩니다. 전화 너머의 목소리는 떨리고 불안에 찬 듯합니다.*

**당신의 선택은?**

1. **전화를 건 사람의 위치를 추적한다** - *위험을
🔍 [Gemini] 파싱 시작: {
  responseLength: 1182,
  linesCount: 23,
  firstFewLines: [
    '### 🔍 수상한 전화',
    '> **질문**: 마니산 정상에서 귀신 토벌 중,  누구도 퇴치할 수 없다는 귀신에 대한 전화를 받았습니다.  어떻게 하시겠습니까?',
    '*밤하늘은 칠흑처럼 어둡고, 바람은 차갑게 귓가를 스칩니다. 전화 너머의 목소리는 떨리고 불안에 찬 듯합니다.*',
    '**당신의 선택은?**',
    '1. **전화를 건 사람의 위치를 추적한다** - *위험을 감수하고,  전화의 발신지를 찾아 나선다. 새로운 단서를 발견할 수 있을지도 모른다.*'
  ]
}
✅ [Gemini] 질문 파싱 성공: 마니산 정상에서 귀신 토벌 중,  누구도 퇴치할 수 없다는 귀신에 대한 전화를 받았습니다.  어떻게 하시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_0',
  text: '전화를 건 사람의 위치를 추적한다',
  description: '위험을 감수하고,  전화의 발신지를 찾아 나선다. 새로운 단서를 발견할 수 있을지도 모른다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_1',
  text: '현재의 귀신 토벌을 마무리하고 전화 내용을 조사한다',
  description: '안전을 우선시하며,  전화 내용에 대한 추가 정보를 수집한다. 시간이 걸릴 수 있다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_2',
  text: '전화를 무시하고 귀신 토벌에 집중한다',
  description: '현재 상황에 집중한다. 하지만 중요한 단서를 놓칠 수도 있다.'
}
✅ [Gemini] 질문 파싱 성공: 전화를 끊은 후, 주변에서 이상한 기운을 느낍니다.  어떻게 하시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_3',
  text: '주변을 탐색하며 기운의 근원을 찾는다',
  description: '위험을 무릅쓰고,  기운의 근원을 찾아 직접 조사한다. 위험에 처할 가능성이 높다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_4',
  text: '마니산을 내려가 안전한 곳으로 이동한다',
  description: '안전을 우선시하며,  일단 마니산을 내려가 상황을 판단한다. 중요한 단서를 놓칠 수도 있다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_5',
  text: '부적이나 도구를 사용하여 기운을 막는다',
  description: '가지고 있는 장비를 활용하여,  이상한 기운으로부터 자신을 보호한다. 효과는 불확실하다.'
}
✅ [Gemini] 질문 파싱 성공: 어둠 속에서 낯선 그림자가 움직이는 것을 목격했습니다. 어떻게 하시겠습니까?
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_6',
  text: '그림자를 따라가 본다',
  description: '위험을 감수하고,  그림자의 정체를 밝히기 위해 추적한다. 위험에 처할 가능성이 높다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_7',
  text: '가만히 숨어서 상황을 관찰한다',
  description: '안전을 우선시하며,  숨어서 그림자의 행동을 관찰한다. 시간이 걸릴 수 있다.'
}
✅ [Gemini] 마크다운 선택지 파싱 성공: {
  id: 'choice_0_8',
  text: '소리를 질러 도움을 요청한다',
  description: '도움을 요청하지만,  그림자가 더욱 가까이 다가올 수도 있다. 효과는 불확실하다.'
}
파싱된 선택지 수: 9개
선택지 1: 전화를 건 사람의 위치를 추적한다
선택지 2: 현재의 귀신 토벌을 마무리하고 전화 내용을 조사한다
선택지 3: 전화를 무시하고 귀신 토벌에 집중한다
선택지 4: 주변을 탐색하며 기운의 근원을 찾는다
선택지 5: 마니산을 내려가 안전한 곳으로 이동한다
선택지 6: 부적이나 도구를 사용하여 기운을 막는다
선택지 7: 그림자를 따라가 본다
선택지 8: 가만히 숨어서 상황을 관찰한다
선택지 9: 소리를 질러 도움을 요청한다
GeminiProvider: 파싱 완료, 선택지 수: 9
AI 질문 생성 완료: {
  questionId: 'question_0',
  questionText: '어둠 속에서 낯선 그림자가 움직이는 것을 목격했습니다. 어떻게 하시겠습니까?',
  choicesCount: 9,
  firstChoice: '전화를 건 사람의 위치를 추적한다'
}