/* Meta Pixel — 전환 이벤트 (Lead)
 *
 * 클릭형 CTA에서 Lead를 발생시킨다.
 *   · 사전신청 (tally.so)       — 킷 런처스 신청 폼으로 이동
 *   · 카카오 상담 (pf.kakao.com) — 카카오 채널 채팅 시작
 *   · 이메일 문의 (mailto, 버튼) — 본문 안내용 mailto 링크는 제외 (btn/cta 클래스만 인식)
 *
 * index.html 문의 폼은 클릭이 아니라 서버 접수 성공 시점이 진짜 전환이므로
 * assets/pages/index.js 의 응답 성공 분기에서 별도로 발생시킨다.
 *
 * 개인정보(이름·이메일·연락처)는 파라미터로 보내지 않는다.
 * 고급 매칭이 필요하면 SHA-256 해시 후 fbq('init', id, {...}) 로 전달해야 한다.
 */
(function () {
  'use strict';

  var RULES = [
    {
      name: '사전신청',
      category: '킷 런처스',
      match: function (a) { return /(^|\.)tally\.so$/.test(a.hostname); }
    },
    {
      name: '카카오 상담',
      category: '상담',
      match: function (a) { return /(^|\.)pf\.kakao\.com$/.test(a.hostname); }
    },
    {
      name: '이메일 문의',
      category: '상담',
      match: function (a) {
        return a.protocol === 'mailto:' &&
               /\b(btn|cta)/.test(a.getAttribute('class') || '');
      }
    }
  ];

  /* 같은 CTA를 연달아 눌러도 페이지뷰당 1회만 집계한다. */
  var fired = {};

  document.addEventListener('click', function (e) {
    var target = e.target;
    var link = target && target.closest ? target.closest('a[href]') : null;
    if (!link) return;

    for (var i = 0; i < RULES.length; i++) {
      if (!RULES[i].match(link)) continue;
      send(RULES[i]);
      return;
    }
  }, true);

  function send(rule) {
    if (typeof window.fbq !== 'function') return;
    if (fired[rule.name]) return;
    fired[rule.name] = true;

    window.fbq('track', 'Lead', {
      content_name: rule.name,
      content_category: rule.category,
      source_url: location.pathname
    });
  }
})();
