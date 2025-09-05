# Safety Navigator 성능 최적화 계획서

## 📊 프로젝트 현황 분석

### 기술 스택
- **프론트엔드**: Next.js 15.4.1 + React 19.1.0
- **지도**: react-kakao-maps-sdk 1.2.0
- **백엔드**: Supabase PostgreSQL + Storage
- **UI**: Radix UI + Tailwind CSS
- **타겟**: 모바일 우선 (데스크톱 미사용)

### 데이터 규모
- **장소 데이터**: 소량 (locations 테이블)
- **사고 데이터**: 7,000개 (press_release_unique 테이블)
- **이미지**: Supabase Storage 저장
- **동시 사용자**: 소규모

### 주요 성능 이슈
1. **지도 로딩 속도 느림** (사용자 체감 이슈)
2. 7,000개 사고 데이터 마커 렌더링 지연
3. 모바일 환경 최적화 부족

## 🔍 성능 병목지점 분석

### 🔴 P0 (심각한 병목)
| 구분 | 위치 | 문제점 | 영향도 |
|------|------|--------|--------|
| 지도 초기화 | `components/kakao-map.tsx:81-88` | 동기식 초기화로 렌더링 차단 | 3-5초 지연 |
| 대량 마커 | `components/kakao-map.tsx:148-193` | 7,000개 데이터 동시 렌더링 | 1-2초 지연 |
| DB 쿼리 | `app/actions/places.ts:103-141` | JOIN 최적화 부족, 인덱스 미활용 | 0.5-2초 |

### 🟡 P1 (중요한 병목)
| 구분 | 위치 | 문제점 | 영향도 |
|------|------|--------|--------|
| 재렌더링 | `components/integrated-map-component.tsx` | loadData 함수 재생성 | 전체 리렌더링 |
| 이미지 최적화 | `next.config.mjs:9-11` | 최적화 비활성화 | 네트워크 사용량 증가 |

## 🎯 최적화 전략 및 우선순위

### Phase 1: 즉시 적용 (1-2일)
**목표**: 60% 성능 향상

#### 1.1 데이터베이스 인덱스 최적화
```sql
-- 위치 기반 검색 최적화
CREATE INDEX CONCURRENTLY idx_locations_geography 
ON locations USING GIST (ST_Point(longitude, latitude));

-- 카테고리별 검색 최적화
CREATE INDEX CONCURRENTLY idx_locations_type_created 
ON locations (type, created_at DESC);
```
- **예상 향상**: 60-80%
- **구현 난이도**: 낮음
- **소요 시간**: 0.5일

#### 1.2 React.memo 적용
```typescript
const KakaoMapMemo = memo(KakaoMap, (prevProps, nextProps) => {
  return (
    prevProps.center.lat === nextProps.center.lat &&
    prevProps.center.lng === nextProps.center.lng &&
    prevProps.places.length === nextProps.places.length
  );
});
```
- **예상 향상**: 30-40%
- **구현 난이도**: 낮음
- **소요 시간**: 1일

#### 1.3 이미지 최적화 활성화
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    unoptimized: false, // 최적화 활성화
    domains: ['supabase-storage-url']
  }
};
```
- **예상 향상**: 20-30%
- **구현 난이도**: 낮음
- **소요 시간**: 0.5일

### Phase 2: 핵심 최적화 (3-5일)
**목표**: 80% 성능 향상

#### 2.1 마커 클러스터링 구현
```typescript
import { MarkerClusterer } from '@kakao/maps-sdk';

const useMarkerClusterer = (map, markers) => {
  const [clusterer, setClusterer] = useState(null);
  
  useEffect(() => {
    if (!map || !markers.length) return;
    
    const newClusterer = new MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 6,
      calculator: [10, 30, 50],
      styles: [/* 모바일 최적화된 스타일 */]
    });
    
    newClusterer.addMarkers(markers);
    setClusterer(newClusterer);
  }, [map, markers]);
};
```
- **예상 향상**: 80-90%
- **구현 난이도**: 높음
- **소요 시간**: 3일

#### 2.2 Progressive Loading
```typescript
const useProgressiveMapLoading = () => {
  const [stage, setStage] = useState('initial');
  
  useEffect(() => {
    // 1단계: 맵만 로드
    loadKakaoMap().then(() => {
      setStage('mapReady');
      // 2단계: 현재 위치 주변만
      loadNearbyData().then(() => setStage('dataReady'));
    });
  }, []);
};
```
- **예상 향상**: 40-60%
- **구현 난이도**: 중간
- **소요 시간**: 2일

### Phase 3: 고도화 (5-7일)
**목표**: 90% 성능 향상

#### 3.1 Viewport 기반 렌더링
```typescript
const useViewportMarkers = (allMarkers, map) => {
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  
  const updateVisibleMarkers = useCallback(
    debounce(() => {
      const bounds = map.getBounds();
      const visible = allMarkers
        .filter(marker => bounds.contain(new kakao.maps.LatLng(marker.lat, marker.lng)))
        .slice(0, 100); // 최대 100개 제한
      setVisibleMarkers(visible);
    }, 100),
    [map, allMarkers]
  );
};
```
- **예상 향상**: 70-80%
- **구현 난이도**: 높음
- **소요 시간**: 3일

#### 3.2 Service Worker 캐싱
```typescript
// 지도 타일 및 API 응답 캐싱
const cacheConfig = {
  runtimeCaching: [{
    urlPattern: /^https:\/\/map\.kakao\.com/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'kakao-map-cache',
      expiration: { maxAgeSeconds: 24 * 60 * 60 }
    }
  }]
};
```
- **예상 향상**: 40-50%
- **구현 난이도**: 중간
- **소요 시간**: 2일

## 📋 구현 로드맵

### Week 1: 기초 최적화
- [x] 성능 분석 완료
- [ ] DB 인덱스 추가
- [ ] React.memo 적용
- [ ] 이미지 최적화 활성화

### Week 2: 핵심 기능 개선
- [ ] 마커 클러스터링 구현
- [ ] Progressive Loading 구현
- [ ] 모바일 터치 최적화

### Week 3: 고도화 및 최적화
- [ ] Viewport 기반 렌더링
- [ ] Service Worker 캐싱
- [ ] 성능 측정 및 튜닝

## 🎯 예상 성능 개선 결과

### 현재 성능 (추정)
- 초기 로딩: 5-8초
- 지도 이동: 1-2초  
- 마커 렌더링: 2-3초
- API 응답: 0.5-2초

### 최적화 후 성능 (목표)
- 초기 로딩: 2-3초 (**60% 개선**)
- 지도 이동: 0.3-0.5초 (**75% 개선**)
- 마커 렌더링: 0.2-0.3초 (**90% 개선**)
- API 응답: 100-300ms (**70% 개선**)

## 🛠️ 구현 권고사항

### /sc:implement 실행 시 권장 설정

#### MCP Servers
- **Sequential**: 복잡한 마커 클러스터링 로직 분석
- **Morphllm**: 다중 파일 패턴 기반 최적화 적용
- **Context7**: Next.js/React 최적화 패턴 참조

#### Personas
- **performance-engineer**: 성능 측정 및 병목지점 분석
- **frontend-architect**: React/Next.js 최적화 구조 설계
- **backend-architect**: Supabase 쿼리 및 인덱스 최적화

#### Modes
- **--orchestrate**: 다중 파일 동시 수정을 위한 도구 조정
- **--token-efficient**: 대량 코드 분석 시 효율성 확보
- **--validate**: 성능 최적화 후 검증 단계

### 단계별 구현 순서
1. **Phase 1** → `--morphllm --backend-architect`
2. **Phase 2** → `--sequential --frontend-architect --orchestrate` 
3. **Phase 3** → `--context7 --performance-engineer --validate`

## 📊 성공 지표

### 기술적 지표
- Lighthouse 성능 점수: 50 → 90+
- FCP (First Contentful Paint): 3s → 1s
- LCP (Largest Contentful Paint): 5s → 2s
- 메모리 사용량: 50% 감소

### 사용자 경험 지표
- 지도 로딩 대기시간: 70% 감소
- 사용자 이탈률: 30% 감소
- 모바일 사용성 점수: 20% 향상

---

**다음 단계**: `/sc:implement performance-optimization-phase1` 실행으로 Phase 1 최적화 시작

  # Phase 1 시작 (가장 효과적인 기초 최적화)
  /sc:implement performance-optimization-phase1 --morphllm --backend-architect

  # Phase 2 진행 (핵심 지도 최적화)
  /sc:implement performance-optimization-phase2 --sequential --frontend-architect --orchestrate

  # Phase 3 완성 (고도화)
  /sc:implement performance-optimization-phase3 --context7 --performance-engineer --validate