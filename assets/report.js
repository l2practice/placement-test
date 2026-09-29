/* ═══════════════════════════════════════════════════════
   VENUS ENGLISH — Report engine (teacher pages only)
   1) Analyses V&G / Listening answers against report-data.js
   2) Builds the feedback sheet as inline-styled HTML that mirrors the
      Google Doc template (Be Vietnam Pro / Lexend, #0a6ebd headings,
      17pt H3, 13pt H4, 11pt body…). The same HTML is shown in the
      preview, converted to a Google Doc by the backend, copied to the
      clipboard, or downloaded as .doc — one source for every output.
   Depends on: assets/report-data.js
   ═══════════════════════════════════════════════════════ */
var Report = (function () {
  'use strict';

  var ORD = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  var LEVEL_VI = { A1: 'A1 / Sơ cấp', A2: 'A2 / Sơ cấp cao', B1: 'B1 / Trung cấp', B2: 'B2 / Trung cấp cao', C1: 'C1 / Cao cấp', C2: 'C2 / Thành thạo' };
  var LEVEL_EN = { A1: 'beginner', A2: 'elementary', B1: 'intermediate', B2: 'upper-intermediate', C1: 'advanced', C2: 'proficient' };
  // Errors on easier items point to a foundation gap, so they rank higher.
  var LEVEL_WEIGHT = { A1: 3, A2: 3, B1: 2, B2: 1.5, C1: 1, C2: 1 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function firstName(full) { var p = String(full || '').trim().split(/\s+/); return p[p.length - 1] || 'Thí sinh'; }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function optText(item, letter) { var i = 'abcd'.indexOf(letter); return i >= 0 && item.o[i] ? item.o[i] : ''; }

  /** IELTS band → CEFR (Cambridge alignment: 4.0–5.0 B1, 5.5–6.5 B2, 7.0–8.0 C1). */
  function levelFromBand(b) {
    b = parseFloat(b);
    if (!(b > 0)) return '';
    return b >= 8.5 ? 'C2' : b >= 7 ? 'C1' : b >= 5.5 ? 'B2' : b >= 4 ? 'B1' : b >= 3 ? 'A2' : 'A1';
  }

  /** Same thresholds as the backend (_submitVG / _submitListening). */
  function scoreLevel(test, score) {
    if (test === 'vg') return score <= 10 ? 'A1' : score <= 20 ? 'A2' : score <= 30 ? 'B1' : score <= 40 ? 'B2' : score <= 47 ? 'C1' : 'C2';
    return score <= 4 ? 'A1' : score <= 8 ? 'A2' : score <= 13 ? 'B1' : score <= 18 ? 'B2' : score <= 22 ? 'C1' : 'C2';
  }

  // ─────────────────────────── ANALYSIS ───────────────────────────
  function analyse(bank, groupKey, groups, answers, total) {
    answers = answers || {};
    var wrong = [], byGroup = {}, byLevel = {}, groupSize = {}, blank = 0;
    bank.forEach(function (it) {
      var g = it[groupKey];
      groupSize[g] = (groupSize[g] || 0) + 1;
      var given = String(answers[it.n] || '').toLowerCase();
      if (given === it.key) return;
      if (!given) blank++;
      wrong.push({ item: it, given: given });
      (byGroup[g] = byGroup[g] || []).push(it.n);
      if (it.lv) byLevel[it.lv] = (byLevel[it.lv] || 0) + 1;
    });
    var priorities = Object.keys(byGroup).map(function (g) {
      var score = byGroup[g].reduce(function (s, n) {
        var it = bank[n - 1]; return s + (LEVEL_WEIGHT[it.lv] || 1.5);
      }, 0);
      return { id: g, name: groups[g].name, en: groups[g].en, advice: groups[g].advice, qs: byGroup[g], score: score };
    }).sort(function (a, b) { return b.score - a.score || b.qs.length - a.qs.length; });
    var strengths = Object.keys(groupSize).filter(function (g) { return !byGroup[g] && groupSize[g] >= 2; })
      .map(function (g) { return groups[g].name; });
    return { total: total, score: total - wrong.length, wrong: wrong, byGroup: byGroup, byLevel: byLevel,
             priorities: priorities, strengths: strengths, blank: blank };
  }
  function analyseVG(answers) { return analyse(VG_BANK, 'cat', VG_CATS, answers, 50); }
  function analyseLIS(answers) {
    var a = analyse(LIS_BANK, 'skill', LIS_SKILLS, answers, 24);
    a.byPart = {};
    a.wrong.forEach(function (w) { a.byPart[w.item.part] = (a.byPart[w.item.part] || 0) + 1; });
    return a;
  }

  function levelSpread(byLevel) {
    return ORD.filter(function (l) { return byLevel[l]; }).map(function (l) { return byLevel[l] + ' câu mức ' + l; }).join(', ');
  }

  function vgComment(a, level, fullName) {
    var fn = firstName(fullName), low = (a.byLevel.A1 || 0) + (a.byLevel.A2 || 0) + (a.byLevel.B1 || 0);
    var hi = (a.byLevel.B2 || 0) + (a.byLevel.C1 || 0) + (a.byLevel.C2 || 0);
    var s = fn + ' đạt ' + a.score + '/50 câu (' + pct(a.score, 50) + '%), tương đương trình độ ' + (level || '—') + '. ';
    if (!a.wrong.length) return s + 'Không có câu sai — nền tảng ngữ pháp và từ vựng rất vững.';
    if (a.strengths.length) s += 'Nắm tốt các mảng: ' + a.strengths.slice(0, 4).join(', ') + '. ';
    s += 'Các câu sai gồm ' + levelSpread(a.byLevel) + '. ';
    if (low > hi) s += 'Phần lớn lỗi nằm ở kiến thức nền (A1–B1), cho thấy còn lỗ hổng cơ bản cần lấp trước khi học cấu trúc nâng cao.';
    else if (low > 0) s += 'Lỗi chủ yếu ở cấu trúc nâng cao (B2–C1), nhưng vẫn còn ' + low + ' lỗi nền tảng cần sửa dứt điểm.';
    else s += 'Nền tảng tốt; các lỗi còn lại thuộc cấu trúc nâng cao B2–C1 — đây là những điểm sẽ cản trở việc đạt band cao trong Writing.';
    if (a.priorities[0]) s += ' Nhóm cần ưu tiên nhất: ' + a.priorities[0].name + '.';
    return s;
  }

  function lisComment(a, level, fullName) {
    var fn = firstName(fullName);
    var s = fn + ' đạt ' + a.score + '/24 câu (' + pct(a.score, 24) + '%), tương đương trình độ ' + (level || '—') + '. ';
    if (!a.wrong.length) return s + 'Không có câu sai — kỹ năng nghe hiểu rất tốt.';
    if (a.strengths.length) s += 'Làm tốt các dạng câu hỏi: ' + a.strengths.join(', ').toLowerCase() + '. ';
    var parts = Object.keys(a.byPart).sort().map(function (p) { return 'Part ' + p + ' (' + a.byPart[p] + ' câu)'; });
    s += 'Câu sai rơi vào ' + parts.join(', ') + '. ';
    if (a.priorities[0]) s += 'Dạng câu hỏi yếu nhất: ' + a.priorities[0].name.toLowerCase() + ' — ' + a.priorities[0].qs.length + ' câu sai.';
    return s;
  }

  function recsText(a, prefix) {
    if (!a.priorities.length) return 'Không có lỗi cần khắc phục. Duy trì luyện tập ở mức độ khó hơn.';
    var lines = a.priorities.map(function (p, i) {
      return '- Ưu tiên ' + (i + 1) + ': ' + p.name + ' (' + p.qs.map(function (n) { return prefix + n; }).join(', ') + '). ' + p.advice;
    });
    return lines.join('\n');
  }

  function overallLevel(parts) {
    var idx = parts.filter(Boolean).map(function (l) { return ORD.indexOf(l); }).filter(function (i) { return i >= 0; });
    return idx.length ? ORD[Math.min.apply(null, idx)] : '';
  }

  // ─────────────────────────── DOC STYLES ───────────────────────────
  // Values measured from the reference Google Doc template.
  var F = "font-family:'Be Vietnam Pro',Arial,sans-serif;";
  var C = { black: '#000000', blue: '#0a6ebd', navy: '#0a3d62', ink: '#1f2933', red: '#c5221f', grey: '#8a97a3',
            green: '#1e7e42', note: '#5b6b7a', warn: '#8a6410', alarm: '#ff0000', footer: '#6fa8dc' };
  var P_BASE = 'margin:0 0 4pt 0;line-height:1.3;text-align:justify;' + F + 'font-size:11pt;color:#000000;';
  var TD = 'border:1pt solid #000000;padding:5pt;vertical-align:top;' + F + 'font-size:11pt;';

  function sp(text, style) {
    style = style || '';
    return '<span style="' + (/font-family/.test(style) ? '' : F) + style + '">' + text + '</span>';
  }
  function p(inner, style) { return '<p style="' + P_BASE + (style || '') + '">' + inner + '</p>'; }
  function blank() { return p('&nbsp;'); }
  function multiline(text, spanStyle) {
    return String(text || '').split(/\n+/).filter(function (l) { return l.trim(); })
      .map(function (l) { return p(sp(esc(l), spanStyle || 'font-size:11pt;color:#000000;')); }).join('');
  }
  function h1(emoji, text) {
    return '<h1 style="margin:0 0 4pt 0;text-align:center;line-height:1.15;">' +
      sp(emoji + ' ', "font-family:'Lexend',sans-serif;font-size:20pt;font-weight:400;") +
      '<span style="font-family:\'Lexend\',sans-serif;font-size:20pt;font-weight:700;color:#000000;">' + esc(text) + '</span></h1>';
  }
  function h2(text) {
    return '<h2 style="margin:18pt 0 8pt 0;line-height:1.15;">' + sp(esc(text), 'font-size:16pt;font-weight:700;color:#000000;') + '</h2>';
  }
  function h3(text, color, size) {
    return '<h3 style="margin:14pt 0 6pt 0;line-height:1.15;">' +
      sp(esc(text), 'font-size:' + (size || 17) + 'pt;font-weight:700;color:' + (color || C.blue) + ';') + '</h3>';
  }
  function h4(text) {
    return '<h4 style="margin:10pt 0 4pt 0;line-height:1.15;">' + sp(esc(text), 'font-size:13pt;font-weight:700;color:' + C.blue + ';') + '</h4>';
  }
  /** rows: array of arrays of cell HTML; opts.head bolds row 0; opts.widths in %; opts.align per column. */
  function table(rows, opts) {
    opts = opts || {};
    var border = opts.borderColor || '#000000';
    var html = '<table style="border-collapse:collapse;width:100%;margin:2pt 0 6pt 0;">';
    rows.forEach(function (r, ri) {
      html += '<tr>';
      r.forEach(function (cell, ci) {
        var w = opts.widths ? 'width:' + opts.widths[ci] + '%;' : '';
        var al = 'text-align:' + ((opts.align && opts.align[ci]) || 'left') + ';';
        var st = TD.replace('#000000', border) + w + al;
        var inner = /^<(p|ul|ol)\b/.test(cell) ? cell : '<p style="margin:0;line-height:1.3;' + al + F + 'font-size:11pt;">' + cell + '</p>';
        if (opts.head && ri === 0) inner = inner.replace(/<p style="/, '<p style="font-weight:700;');
        html += '<td style="' + st + '">' + inner + '</td>';
      });
      html += '</tr>';
    });
    return html + '</table>';
  }
  function b(text) { return '<b>' + text + '</b>'; }
  function cellP(inner, style) {
    style = style || '';
    return '<p style="margin:0 0 2pt 0;line-height:1.3;' + F + (/font-size/.test(style) ? '' : 'font-size:10.5pt;') + style + '">' + inner + '</p>';
  }

  // ─────────────────────────── DOC SECTIONS ───────────────────────────
  function headerSection(ctx) {
    var s = ctx.student || {};
    var red = 'color:' + C.alarm + ';font-style:italic;';
    return blank() +
      h1('🎯', 'PLACEMENT TEST') +
      p(sp('Phiếu Nhận Xét &amp; Đánh Giá Năng Lực', 'font-size:9pt;font-style:italic;color:#000000;'), 'text-align:center;') +
      p(sp('Ngày: ' + esc(ctx.date), 'font-size:11pt;font-weight:700;font-style:italic;')) +
      table([
        [b('Thí sinh'), '<i>' + esc(s.fullName || ctx.username) + '</i>', '<i>Email: ' + esc(s.email || '—') + '</i>'],
        [b('Mục tiêu band'), sp(esc(s.targetBand || '—'), red), sp('Dự định thi: ', red) + sp(esc(s.examDate || '—'), red + 'font-weight:700;')],
        [b('Trình độ chung'), '<i>' + esc(LEVEL_VI[ctx.overall.level] || ctx.overall.level || '—') + '</i>', ctx.overall.classRec ? '<i>Khuyến nghị: ' + esc(ctx.overall.classRec) + '</i>' : '&nbsp;']
      ], { widths: [21, 28, 51] }) + blank();
  }

  function scoreTable(score, total, level, lastHead) {
    var pc = pct(score, total);
    return table([
      [b('Tiêu chí'), b('Điểm số'), b('Tỉ lệ'), b(lastHead)],
      [b('Tổng điểm'), score + ' / ' + total, pc + '%', esc(level || '—')],
      [b('Số câu sai'), (total - score) + ' câu', (100 - pc) + '%', '—']
    ], { align: ['center', 'center', 'center', 'center'] });
  }

  function analysisCell(w, prefixChosen) {
    var it = w.item, trap = w.given && it.traps ? it.traps[w.given] : '';
    return cellP(b(esc(it.point)), 'font-size:11pt;') +
      cellP('<i>' + esc(it.q) + '</i>', 'color:' + C.note + ';') +
      cellP(sp('Cho thấy: ', 'font-weight:700;color:' + C.red + ';') + esc(trap ? trap + ' ' + it.gap : (w.given ? it.gap : 'Bỏ trống câu này. ' + it.gap))) +
      cellP(sp('Cần cải thiện: ', 'font-weight:700;color:' + C.green + ';') + esc(it.fix));
  }
  function chosenCell(w) {
    if (!w.given) return '<i>Bỏ trống</i>';
    return 'Chọn: ' + esc(w.given) + '<br><span style="color:' + C.note + ';font-size:9.5pt;">' + esc(optText(w.item, w.given)) + '</span>';
  }
  function keyCell(it) {
    return 'Đúng: ' + esc(it.key) + '<br><span style="color:' + C.green + ';font-size:9.5pt;">' + esc(optText(it, it.key)) + '</span>';
  }

  function groupTable(a, head, prefix) {
    var rows = [[b(head), b('Số lượng'), b('Câu liên quan')]];
    a.priorities.forEach(function (g) { rows.push([esc(g.name), g.qs.length + ' câu', g.qs.map(function (n) { return prefix + n; }).join(', ')]); });
    return table(rows, { widths: [50, 18, 32], align: ['left', 'center', 'center'] });
  }

  function recsBlock(text) {
    return p(sp('Dựa trên phân tích lỗi, các điểm cần tập trung:', 'font-size:11pt;')) +
      String(text || '').split(/\n+/).filter(function (l) { return l.trim(); }).map(function (l) {
        // "- Ưu tiên 1: <group name> (C18, C38). <advice>" → bold label + navy group + plain advice
        var m = l.match(/^(-\s*Ưu tiên \d+:\s*)(.*?\((?:C\d+(?:,\s*)?)+\)\.?)(.*)$/);
        if (m) return p(sp(esc(m[1]), 'font-weight:700;') + sp(esc(m[2]), 'font-weight:700;color:' + C.navy + ';') + sp(esc(m[3])));
        return p(sp(esc(l)));
      }).join('');
  }

  function vgSection(ctx) {
    var v = ctx.vg; if (!v) return '';
    var a = v.analysis, html = h2('📝 PHẦN 1: Ngữ Pháp & Từ Vựng') + scoreTable(a.score, 50, v.level, 'Trình độ') + blank();
    html += h3('Nhận xét chung') + multiline(v.comment) + blank();
    if (a.wrong.length) {
      html += h3('📋 Phân tích chi tiết — ' + a.wrong.length + ' câu sai');
      var rows = [[b('Câu'), b('Thí sinh chọn'), b('Đáp án đúng'), b('Phân tích lỗi')]];
      a.wrong.forEach(function (w) { rows.push(['Câu ' + w.item.n, chosenCell(w), keyCell(w.item), analysisCell(w)]); });
      html += table(rows, { head: true, widths: [10, 17, 17, 56], align: ['center', 'center', 'center', 'left'] }) + blank();
      html += h3('📊 Tổng hợp dạng lỗi') + groupTable(a, 'Dạng lỗi', 'C') + blank();
    }
    html += h3('✅ Khuyến nghị theo thứ tự ưu tiên') + recsBlock(v.recs) + blank();
    return html;
  }

  function lisSection(ctx) {
    var l = ctx.listening; if (!l) return '';
    var a = l.analysis, html = h2('🎧 PHẦN 3: Kỹ Năng Nghe') + scoreTable(a.score, 24, l.level, 'Xếp loại') + blank();
    html += h3('Nhận xét chung') + multiline(l.comment) + blank();
    if (a.wrong.length) {
      html += h3('📋 Phân tích chi tiết — ' + a.wrong.length + ' câu sai');
      var rows = [[b('Câu'), b('Part'), b('Thí sinh chọn'), b('Đáp án đúng'), b('Phân tích lỗi')]];
      a.wrong.forEach(function (w) {
        rows.push(['Câu ' + w.item.n, 'Part ' + w.item.part, chosenCell(w), keyCell(w.item),
          cellP(sp(esc(LIS_SKILLS[w.item.skill].name), 'font-weight:700;color:' + C.navy + ';')) + analysisCell(w)]);
      });
      html += table(rows, { head: true, widths: [9, 9, 16, 16, 50], align: ['center', 'center', 'center', 'center', 'left'] }) + blank();
      html += h3('📊 Tổng hợp theo dạng câu hỏi') + groupTable(a, 'Kỹ năng nghe', 'C') + blank();
      html += h3('✅ Khuyến nghị theo thứ tự ưu tiên') + recsBlock(l.recs) + blank();
    }
    html += h3('📋 Chi tiết từng câu');
    var all = [[b('Câu'), b('Part'), b('Thí sinh chọn'), b('Đáp án đúng'), b('Kết quả')]];
    LIS_BANK.forEach(function (it) {
      var g = String((l.answers || {})[it.n] || '').toLowerCase(), ok = g === it.key;
      all.push(['Câu ' + it.n, 'Part ' + it.part, esc(g || '—'), it.key, ok ? '✅ Đúng' : '❌ Sai']);
    });
    return html + table(all, { head: true, align: ['center', 'center', 'center', 'center', 'center'] }) + blank();
  }

  function listItems(items, tag) {
    return '<' + tag + ' style="margin:0 0 4pt 0;padding-left:18pt;">' + items.map(function (i) {
      return '<li style="margin:0 0 5pt 0;line-height:1.3;' + F + 'font-size:11pt;color:' + C.ink + ';">' + i + '</li>';
    }).join('') + '</' + tag + '>';
  }
  function fixItem(wrong, right, why) {
    var arrow = sp('&nbsp;→&nbsp;', 'font-weight:700;color:' + C.grey + ';');
    return sp(esc(wrong), 'font-weight:700;color:' + C.red + ';') + arrow + sp(esc(right), 'font-weight:700;color:' + C.green + ';') +
      (why ? '<br>' + sp(esc(why), 'font-style:italic;color:' + C.note + ';') : '');
  }

  function writingSection(ctx) {
    var w = ctx.writing; if (!w) return '';
    var ai = w.ai || null, s = ctx.student || {};
    var lab = 'font-size:10.5pt;font-weight:700;color:' + C.navy + ';', val = 'font-size:10.5pt;color:' + C.ink + ';';
    var html = h2('✍️ PHẦN 2: Kỹ Năng Viết') + blank() + table([
      [sp('👤 Student', lab), sp(esc(s.fullName || ctx.username), val)],
      [sp('🏫 Class', lab), sp('Placement test', val)],
      [sp('📝 Topic', lab), sp(esc(w.topic || '—'), val)],
      [sp('📊 Task', lab), sp(esc((ai && ai.task_type) || '—'), val)],
      [sp('🎯 Mode', lab), sp('Free Writing', val)],
      [sp('🕒 Generated', lab), sp(esc(ctx.isoDate), val)]
    ], { borderColor: '#ffffff', widths: [22, 78] }) + blank();

    html += p(sp('Bài viết gốc của thí sinh:', 'font-weight:700;')) + multiline(w.essay) + blank();

    var overallText = w.overallComment || (ai && ai.overall_feedback_vi) || w.teacherComment || '';
    if (!ai && !overallText) return html;
    html += h3('💬 Feedback');
    if (overallText) html += h4('⭐ Nhận xét chung') + multiline(overallText, 'font-size:11pt;color:' + C.ink + ';');
    var rep = w.repeatedErrors || (ai && ai.repeated_errors_vi) || '';
    if (rep) html += h4('⚠️ Lỗi lặp lại') + multiline(rep, 'font-size:11pt;color:' + C.warn + ';');
    if (ai && ai.tr_comments && ai.tr_comments.length) {
      html += h4('🎯 Task Response') + listItems(ai.tr_comments.map(function (t) {
        return sp(esc(t.paragraph_role) + ':', 'font-weight:700;color:' + C.navy + ';') + ' ' + esc(t.assessment_vi) +
          (t.suggestion_en ? '<br>' + sp('→ ' + esc(t.suggestion_en), 'font-style:italic;color:' + C.green + ';') : '');
      }), 'ol');
    }
    if (ai && ai.gra_errors && ai.gra_errors.length) {
      html += h4('🔧 Grammar (' + ai.gra_errors.length + ')') +
        listItems(ai.gra_errors.map(function (e) { return fixItem(e.wrong, e.correct, e.explanation_vi); }), 'ul');
    }
    if (ai && ai.lr_issues && ai.lr_issues.length) {
      html += h4('📚 Lexical Resource (' + ai.lr_issues.length + ')') +
        listItems(ai.lr_issues.map(function (e) { return fixItem(e.original, e.better, e.explanation_vi); }), 'ul');
    }
    var cc = ai && ai.cc_feedback;
    if (cc && (cc.assessment_vi || (cc.logic_points || []).length)) {
      html += h4('🔗 Coherence & Cohesion') + multiline(cc.assessment_vi, 'font-size:11pt;color:' + C.ink + ';');
      (cc.logic_points || []).forEach(function (lp) {
        html += p(sp('- ' + esc(lp.label_vi) + ':', 'font-weight:700;color:' + C.ink + ';') + ' ' + sp(esc(lp.content_vi), 'color:' + C.ink + ';'));
      });
      var ch = cc.logic_chain;
      if (ch && ch.steps && ch.steps.length) {
        html += h3('Tóm tắt lại "đường dây logic" của ' + (ch.paragraph ? ch.paragraph.toLowerCase() : 'đoạn văn') + ' đang bị lỗi:', C.alarm, 11);
        ch.steps.forEach(function (st, i) { html += p(sp((i + 1) + '. ' + esc(st))); });
        if (ch.verdict_vi) html += p(sp('→ ' + esc(ch.verdict_vi), 'font-weight:700;color:' + C.alarm + ';'));
      }
    }
    if (w.teacherComment && w.teacherComment !== overallText) {
      html += h4('📝 Ghi chú của giáo viên') + multiline(w.teacherComment, 'font-size:11pt;color:' + C.ink + ';');
    }
    html += blank() + h3('Đánh giá theo 4 tiêu chí IELTS');
    var sc = (ai && ai.scores) || {};
    function band(v) { return v === undefined || v === null || v === '' ? '—' : Number(v).toFixed(1); }
    html += table([
      [b('Tiêu chí'), b('Band')],
      ['✅ Task Achievement', band(sc.TR)],
      ['✅ Coherence &amp; Cohesion', band(sc.CC)],
      ['✅ Lexical Resource', band(sc.LR)],
      ['✅ Grammatical Range', band(sc.GRA)],
      ['🎯 ' + b('OVERALL'), b(band(w.band))]
    ], { widths: [70, 30], align: ['left', 'center'] }) + blank();
    return html;
  }

  function speakingSection(ctx) {
    var sp_ = ctx.speaking, ai = sp_ && sp_.ai;
    if (!sp_ || (!sp_.band && !sp_.comment && !ai)) return '';
    var html = h2('🎙 PHẦN 4: Kỹ Năng Nói') + table([
      [b('Band giáo viên'), esc(sp_.band || 'Chưa chấm')],
      [b('Trình độ'), esc(levelFromBand(sp_.band) || '—')]
    ], { widths: [30, 70] }) + blank();
    if (!ai) return html + (sp_.comment ? h3('Nhận xét') + multiline(sp_.comment) + blank() : '');
    var ink = 'font-size:11pt;color:' + C.ink + ';';
    html += h3('💬 Feedback') + h4('⭐ Nhận xét chung') + multiline(ai.overall_vi, ink);
    var icons = { 'Fluency & Coherence': '🗣', 'Lexical Resource': '📚', 'Grammatical Range & Accuracy': '🔧', 'Pronunciation': '🔊' };
    (ai.criteria || []).forEach(function (c) {
      html += h4((icons[c.name] || '✅') + ' ' + c.name + ' — Band ' + c.band) + multiline(c.assessment_vi, ink) +
        p(sp('→ ' + esc(c.improvement_vi), 'font-style:italic;color:' + C.green + ';'));
    });
    if (ai.priorities_vi && ai.priorities_vi.length) html += h4('✅ Ưu tiên luyện tập') + listItems(ai.priorities_vi.map(esc), 'ol');
    if (ai.criteria && ai.criteria.length) {
      html += blank() + h3('Đánh giá theo 4 tiêu chí IELTS Speaking');
      var rows = [[b('Tiêu chí'), b('Band')]];
      ai.criteria.forEach(function (c) { rows.push(['✅ ' + esc(c.name), Number(c.band).toFixed(1)]); });
      rows.push(['🎯 ' + b('OVERALL'), b(esc(sp_.band || '—'))]);
      html += table(rows, { widths: [70, 30], align: ['left', 'center'] });
    }
    return html + blank();
  }

  function summarySection(ctx) {
    var v = ctx.vg, w = ctx.writing, l = ctx.listening, s = ctx.speaking, o = ctx.overall;
    var rows = [[b('Phần thi'), b('Điểm thô'), b('Tỉ lệ'), b('Trình độ / Band')]];
    rows.push(['📝 Ngữ Pháp &amp; Từ Vựng', v ? v.analysis.score + '/50' : '—', v ? pct(v.analysis.score, 50) + '%' : '—', v ? esc(v.level) : '—']);
    rows.push(['✍️ Viết', w && w.band ? esc(w.band) : '—', '—', w && w.band ? esc(levelFromBand(w.band)) : '—']);
    rows.push(['🎧 Nghe', l ? l.analysis.score + '/24' : '—', l ? pct(l.analysis.score, 24) + '%' : '—', l ? esc(l.level) : '—']);
    var spBand = s && s.band;
    rows.push(['🎙 Nói', spBand ? esc(spBand) : '—', '—', spBand ? esc(levelFromBand(spBand)) : '—']);
    rows.push([b('🎯 TỔNG CHUNG'), '—', '—', b(esc(LEVEL_VI[o.level] || o.level || '—')) + (spBand ? '' : '<i>(Chưa có kỹ năng Nói)</i>')]);
    var html = h2('📊 TỔNG KẾT ĐÁNH GIÁ') + table(rows, { align: ['left', 'center', 'center', 'center'] }) + blank();
    html += h3('Đánh giá tổng thể');
    html += p(sp(esc(firstName((ctx.student || {}).fullName)) + ' đạt trình độ tổng thể ' + esc(o.level || '—') +
      (LEVEL_EN[o.level] ? ' (' + LEVEL_EN[o.level] + ')' : '') + ' qua bài kiểm tra xếp lớp.'));
    var strengths = String(o.strengths || '').split(/\n+/).map(function (x) { return x.replace(/^[-•]\s*/, '').trim(); }).filter(Boolean);
    if (strengths.length) html += p(sp('- Điểm mạnh:', 'font-weight:700;')) + listItems(strengths.map(esc), 'ul');
    if (o.improvements) html += p(sp('- Điểm cần cải thiện: ', 'font-weight:700;') + sp(esc(o.improvements).replace(/\n+/g, '<br>')));
    if (o.classRec) html += p(sp('- Khuyến nghị lớp học: ', 'font-weight:700;') + sp(esc(o.classRec)));
    return html + p('—' + new Array(40).join('-'), 'font-weight:700;') +
      p(sp('Phiếu nhận xét — Venus English — ' + esc((ctx.student || {}).fullName || ctx.username) + ' — ' + esc(ctx.date.replace(/\//g, '-')),
        'font-size:9pt;font-style:italic;color:' + C.footer + ';'), 'text-align:right;');
  }

  /** Full sheet body (no <html> wrapper) — used for preview and every export. */
  function buildDocBody(ctx) {
    return '<div style="' + F + 'color:#000000;">' + headerSection(ctx) + vgSection(ctx) + writingSection(ctx) +
      lisSection(ctx) + speakingSection(ctx) + summarySection(ctx) + '</div>';
  }
  /** Standalone document for Drive conversion / .doc download. */
  function wrapDocument(bodyHtml, title) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + esc(title) + '</title></head>' +
      '<body style="' + F + 'font-size:11pt;">' + bodyHtml + '</body></html>';
  }

  return {
    ORD: ORD, LEVEL_VI: LEVEL_VI, LEVEL_EN: LEVEL_EN,
    esc: esc, firstName: firstName, levelFromBand: levelFromBand, scoreLevel: scoreLevel, optText: optText,
    analyseVG: analyseVG, analyseLIS: analyseLIS,
    vgComment: vgComment, lisComment: lisComment, recsText: recsText, overallLevel: overallLevel,
    buildDocBody: buildDocBody, wrapDocument: wrapDocument
  };
})();
