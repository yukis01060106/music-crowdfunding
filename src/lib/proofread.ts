// プロジェクトページの校正。ルールチェックはブラウザで即時に、AI校正は /api/proofread（Gemini）で行う。
// ルールは CAMPFIRE の審査基準と景品表示法の考え方を参考にしている。最終判断は運営の審査で行う。

export type Severity = "error" | "warning" | "info";

export const SEVERITY_LABELS: Record<Severity, string> = {
  error: "要修正",
  warning: "確認",
  info: "提案",
};

/** 校正にかける文章1つ分。id は修正を反映するときの宛先 */
export interface ProofreadField {
  id: string;
  label: string;
  text: string;
}

export interface ProofreadIssue {
  fieldId: string;
  /** 問題のある箇所。field.text にそのまま含まれる文字列 */
  excerpt: string;
  /** 置き換え案。削除を勧める場合は空文字 */
  suggestion?: string;
  reason: string;
  severity: Severity;
  source: "rule" | "ai";
}

interface Rule {
  pattern: RegExp;
  severity: Severity;
  reason: string;
  suggestion?: string;
  /** このルールを当てるフィールド（id の接頭辞）。未指定なら全フィールド */
  only?: string[];
}

const RULES: Rule[] = [
  {
    pattern: /世界初|日本初|国内初|業界初|史上初/g,
    severity: "error",
    reason: "根拠のない「初」は、景品表示法の不当表示にあたるおそれがあります。調査の出典を添えるか、表現を変えてください。",
  },
  {
    pattern: /No\.?\s?1|ナンバーワン|最高傑作|最強|最安|日本一|世界一/gi,
    severity: "warning",
    reason: "最上級の表現には客観的な根拠が必要です。根拠を示せない場合は言い換えてください。",
  },
  {
    pattern: /絶対に?|必ず|確実に|100[%％]/g,
    severity: "warning",
    reason: "確約できないことを断定すると、実現できなかったときにトラブルになります。「〜を目指します」などに。",
  },
  {
    pattern: /投資|配当|利回り|元本|出資|儲か/g,
    severity: "error",
    reason: "購入型クラウドファンディングでは、金融商品と誤解される言葉は使えません。「支援」「応援」と書いてください。",
    suggestion: "支援",
  },
  {
    pattern: /寄付|寄附/g,
    severity: "warning",
    reason: "OTOFUNDは寄付ではなく、リターンのある支援です。税金の控除などの誤解を防ぐため「支援」と書いてください。",
    suggestion: "支援",
  },
  {
    pattern: /生活費|借金|返済|ローン/g,
    severity: "error",
    reason: "個人の生活費や借金の返済は、資金の使い道として掲載できません。",
    only: ["budget", "story", "summary"],
  },
  {
    pattern: /[！!]{2,}|[？?]{2,}/g,
    severity: "info",
    reason: "記号の連続は、ページ全体で多用すると読みにくくなります。",
  },
  {
    pattern: /[ｦ-ﾟ]+/g,
    severity: "info",
    reason: "半角カタカナは、端末によって表示が崩れることがあります。全角にしてください。",
  },
];

/** 1文がこの文字数を超えたら、分けることを提案する */
const LONG_SENTENCE = 120;

export function ruleCheck(fields: ProofreadField[]): ProofreadIssue[] {
  const issues: ProofreadIssue[] = [];
  for (const field of fields) {
    if (!field.text.trim()) continue;
    for (const rule of RULES) {
      if (rule.only && !rule.only.some((prefix) => field.id.startsWith(prefix))) continue;
      const seen = new Set<string>();
      for (const match of field.text.matchAll(rule.pattern)) {
        if (seen.has(match[0])) continue;
        seen.add(match[0]);
        issues.push({
          fieldId: field.id,
          excerpt: match[0],
          suggestion: rule.suggestion,
          reason: rule.reason,
          severity: rule.severity,
          source: "rule",
        });
      }
    }
    for (const sentence of field.text.split(/(?<=[。！？!?\n])/)) {
      if (sentence.trim().length > LONG_SENTENCE) {
        issues.push({
          fieldId: field.id,
          excerpt: sentence.trim(),
          reason: `1文が${sentence.trim().length}文字あります。スマホでは読みにくいので、2〜3文に分けてみてください。`,
          severity: "info",
          source: "rule",
        });
      }
    }
  }
  return issues;
}

/** AI に渡す指示。ルールと同じ観点に加えて、誤字脱字や読みやすさも見てもらう */
export const PROOFREAD_INSTRUCTION = `あなたは音楽専門の購入型クラウドファンディング「OTOFUND」の編集者です。
アーティストが書いたプロジェクトページの文章を校正してください。

見る観点:
1. 誤字脱字、変換ミス、助詞の誤り
2. 表記ゆれ（同じ言葉の書き方がフィールド間でばらついている）
3. 読みやすさ（長すぎる文、主語と述語のねじれ、スマホで読みにくい書き方）
4. 景品表示法：根拠のない最上級表現（No.1、日本初、最高 など）や、確約できない断定（絶対、必ず）
5. 購入型クラファンでは使えない言葉（投資、配当、元本、寄付 など）
6. リターンの説明に、支援者が知りたい情報（内容、数量、時期、使用条件、有効期限）が欠けていないか
7. カバー曲や他人の写真など、権利の確認が必要そうな記述

ルール:
- アーティスト本人の想いや語り口は尊重し、書き換えすぎない。直すのは問題がある箇所だけ。
- excerpt には、元の文章に含まれる文字列を一字一句そのまま入れる（要約しない、20文字程度まで）。
- suggestion には excerpt を置き換える文字列を入れる。置き換えではなく書き足しを勧める場合は空にして reason に書く。
- severity は、審査で差し戻されうるものを error、確認してほしいものを warning、より良くするための提案を info にする。
- 問題がなければ issues は空の配列にする。
- reason は日本語で、アーティストに向けてやさしく1〜2文で。`;
