# MediChart Lite v2

> ⚠️ **このアプリは学習・ポートフォリオ用のデモです。実在する患者の情報・個人情報は絶対に入力しないでください。**
> 医療機器ではなく、診断・治療・投薬判断・看護判断には使用できません。扱うデータはすべて架空情報です。

**Production:** https://medichart-lite.vercel.app/

MediChart Lite は、看護師経験を活かして制作した **架空患者専用の医療・看護記録支援 Web アプリ** です。
v2 では「患者登録デモ」から、患者情報・バイタル・経過記録・SOAP・内服・申し送り・タイムラインを
患者単位で統合管理できる業務支援 UI へ発展させました。

- サーバー・データベース・ログイン・有料 API を使わず、**追加費用 0 円**で動作します。
- データは閲覧しているブラウザの Local Storage にのみ保存され、外部へ送信されません。
- 英語を主表示、日本語を補助表示にしたバイリンガル UI です。

---

## 医療安全・公開デモの方針

| 方針 | 実装 |
| --- | --- |
| 実患者データ禁止 | 全画面上部とフッターに注意書きを常時表示。Demo Data は創作名＋「架空」表記 |
| 診断・治療・投薬判断をしない | 判定・推奨・相互作用チェック等の機能は実装していない |
| バイタルの異常判定をしない | 「デモ閾値外」は固定値との単純比較による**参考表示**であることを画面上に明記 |
| 申し送りの優先度 | 業務整理のラベルであり、医学的な緊急度判定ではないことを明記 |
| AI 出力を医療判断として扱わない | 記録支援の出力は必ず「下書き」として表示し、保存は利用者の確認・編集後のみ |
| 共有データを第三者が壊せない | 共有 DB を持たない。各閲覧者のデータはその人のブラウザ内だけで完結 |
| secret を持たない | 環境変数・API キー不要。`.env` もコミットしていない |

---

## 主な機能

### Dashboard
- **本日の状況**: 本日の記録件数（バイタル / 経過記録 / SOAP / 申し送り）、未確認の申し送り数
- **要確認リスト**: 優先の未確認申し送り → 最新バイタルのデモ閾値外 → 未確認申し送り → 本日バイタル未記録 の順に表示（業務上の確認順であり、医学的な緊急度ではない）
- **病室情報（Room Board）**: 病室ごとの患者と、アレルギー・閾値外・申し送りバッジ
- 患者統計（登録患者数・男性・女性・その他/未回答・平均年齢・疾患件数）
- 最近の看護記録・SOAP、最新バイタル、最近登録患者、最近更新患者
- Demo Data 生成（既存 Demo Data がある場合は確認ダイアログ）

### Patients
- 患者ID・氏名検索（大文字小文字・全角英数・空白の違いを無視）
- 病室 / 性別 / 疾患 / 状態（未確認申し送り・デモ閾値外・アレルギー・本日未測定）で絞り込み
- 並び替え（更新日時・登録日時・病室・患者ID・氏名・年齢）
- Desktop は一覧表、タブレット・スマートフォン幅ではカード表示に切り替え

### Patient Detail（v2 の中心画面）
- 患者ヘッダー: 患者ID・氏名・年齢・性別・病室・血液型・主要疾患・最終更新・**アレルギー重要表示**・未確認事項
- URL と連動するタブ（`#/patients/:id/:tab`）。矢印キー / Home / End で操作可能

| タブ | 内容 |
| --- | --- |
| Overview / 概要 | 最新バイタル、最新申し送り、基本情報、疾患・主訴・既往歴、最新記録、内服概要、患者サマリー下書き |
| Vitals / バイタル | BT・SBP・DBP・HR・RR・SpO₂・疼痛・意識状態・備考の記録/編集/削除、最新値、推移グラフ、履歴 |
| Records / 経過記録 | 記録種別・記録者（架空）・本文・タグ。種別/タグで絞り込み、要点整理の下書き |
| SOAP | S / O / A / P を独立入力。一覧・編集・削除、文章からの S/O/A/P 振り分け下書き |
| Medications / 内服 | 定期薬・臨時薬、用量・単位・用法・開始日・終了日・状態（継続中/一時中止/終了）・備考 |
| Medical Info / 医療情報 | 基本情報・アレルギー・既往歴・主訴・備考・疾患（テンプレート + 自由入力） |
| Handover / 申し送り | 優先度・内容・注意事項・確認状態（確認済み/未確認に戻す）、保存データからの下書き作成 |
| Timeline / タイムライン | 登録・情報更新・バイタル・記録・SOAP・内服変更・申し送り/確認を日付ごとに統合表示 |

### New Patient
- 患者ID（半角英数・`-`・`_`、20 文字以内、重複不可、`DEMO-` は予約）、氏名必須
- 生年月日: 実在しない日付・未来日・130 年以上前を拒否、年齢自動計算
- 疾患テンプレート（17 種）＋自由入力、アレルギー・既往歴・主訴・備考
- エラーは日本語で入力欄の直下に表示し、`aria-describedby` で関連付け

### Data & Safety / データ管理
- 保存方式・schema version・件数・データ量の表示
- Demo Data の生成 / 再生成 / 削除（確認ダイアログ付き）
- JSON バックアップの保存（端末へのダウンロードのみ）
- 読み込めなかった保存データの退避コピーの保存・破棄
- 全データ初期化（確認ダイアログ付き）

---

## 記録支援（AI 機能）の位置付け

- 既定の Provider は **ローカル規則ベース（外部送信なし・API キー不要・0 円）**。
- できること: 長文記録の要点抜き出し / 文章の S・O・A・P 振り分け / 保存データから申し送り下書き / 患者サマリー下書き
- しないこと: 診断、治療提案、投薬判断、医学的な緊急度判定、新しい臨床内容（A・P など）の生成
- 出力には必ず注意事項を表示し、フォームへ「反映」しても自動保存はしません。
- `src/ai/types.ts` の `RecordAssistProvider` インターフェースで責務を分離しているため、将来 LLM を接続する場合も
  UI を変えずに Provider を差し替えられます（その場合も API キーはサーバー側に置き、クライアントへ露出させない想定）。

---

## 技術スタック

| 分類 | 内容 |
| --- | --- |
| UI | React 19 |
| 言語 | TypeScript 6（`any` 不使用） |
| ビルド | Vite 8 |
| スタイル | プレーン CSS（テーマトークンによる Light / Dark） |
| グラフ | Recharts（バイタル推移のみ遅延読み込み） |
| ルーティング | 自前のハッシュルーター（依存なし・静的ホスティングでリロード/直リンク可） |
| データ保存 | ブラウザの Local Storage |
| テスト | Vitest |
| Lint | oxlint |
| ホスティング | Vercel（静的配信） |

---

## セットアップ

Node.js（開発環境は v24）と npm が必要です。

```bash
git clone https://github.com/aicmode/medichart-lite.git
cd medichart-lite
npm install
npm run dev
```

起動後、ターミナルに表示される URL（既定 http://localhost:5173/ ）を開きます。環境変数の設定は不要です。

## Scripts

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 型チェック（`tsc -b`）＋本番ビルド（`dist/`） |
| `npm run preview` | ビルド結果のローカル確認 |
| `npm run typecheck` | TypeScript 型チェック |
| `npm run lint` | oxlint |
| `npm run test` | Vitest（ユニットテスト） |
| `npm run check` | typecheck → lint → test → build を一括実行 |

---

## 画面 URL

| URL | 画面 |
| --- | --- |
| `#/` | Dashboard |
| `#/patients` | 患者一覧 |
| `#/patients/new` | 患者登録 |
| `#/patients/:id` | 患者詳細（Overview） |
| `#/patients/:id/vitals` など | 患者詳細の各タブ（`vitals` `records` `soap` `medications` `medical` `handover` `timeline`） |
| `#/data` | データ管理・安全方針 |
| それ以外 / 存在しない患者 | Not Found 表示 |

---

## データ保存方式とマイグレーション

- 保存キー: `medichart-lite:app-data:v1`（v1 から互換のためキー名は据え置き、中身の `version` で管理）
- 現在の schema: **v4**
- 読み込み処理（`src/utils/storage.ts`）は保存データを 1 件ずつ検証し、
  - v1〜v3 に存在しない配列（`soapRecords` / `handovers` / `medications`）や項目（`tags` / `updatedAt` / `status` など）を補完
  - 旧データの内服状態は終了日から推定（終了日が過去なら「終了」）
  - 不正な選択肢・日時は安全な既定値に置換、患者に紐づかない孤立レコードは除外（件数を画面に通知）
- JSON が壊れている場合はクラッシュせず、元の文字列を `medichart-lite:app-data:corrupt-backup` へ退避してからサンプルで起動します。
- 旧形式の「SOAP」「申し送り」種別の看護記録は削除せず、経過記録タブに旧形式として表示します。

```ts
interface AppData {
  version: number;            // 4
  patients: Patient[];
  vitalSigns: VitalSign[];    // patientId → Patient.id
  nursingNotes: NursingNote[];
  soapRecords: SoapRecord[];
  medications: Medication[];
  handovers: HandoverRecord[];
  sampleDataLoaded: boolean;  // 初回サンプルの重複投入防止
}
```

すべての記録は `id`（UUID）・`patientId`・`createdAt`・`updatedAt`（ISO 8601）を持ちます。
タイムラインは専用データを保存せず、各記録の日時から表示用に生成します（削除した記録は表示されません）。

## Demo Data

- 完全に創作した氏名の架空患者 10 名（患者ID `DEMO-0001`〜）と、バイタル履歴・経過記録・SOAP・内服・申し送りを生成します。
- 日時は生成時刻からの相対値のため、いつ生成しても「本日の記録」「要確認」を確認できます。
- 一部のバイタルは「デモ閾値外」表示を確認できるよう意図的に設定しています（医学的な意味はありません）。
- 再生成・削除は `DEMO-` 患者だけが対象で、利用者が登録した患者には影響しません（`DEMO-` の患者IDは登録時に予約済み）。

---

## 品質・アクセシビリティ

- `label` と入力欄の関連付け、`aria-invalid` / `aria-describedby` によるエラー通知、送信時に最初のエラー欄へフォーカス
- WAI-ARIA Tabs パターン、確認ダイアログのフォーカストラップ・Escape・フォーカス復帰、スキップリンク
- 画面遷移時に見出しへフォーカスを移動、`prefers-reduced-motion` 対応
- 濃色背景上の補助テキストを含めコントラスト比 4.5:1 以上（axe-core で確認）
- レスポンシブ: 960px 以下でヘッダー型ナビ・患者一覧カード化、720px 以下でフォーム 1 カラム・タブ横スクロール
- ユニットテスト: 入力検証、保存データのマイグレーション・破損時処理、ルーティング、デモ閾値、タイムライン、集計、記録支援、Demo Data

---

## ディレクトリ構成（主要部分）

```
src/
├── ai/                  # 記録支援 Provider（インターフェース + ローカル規則ベース実装）
├── components/
│   ├── patient/         # Patient Detail の各タブ・患者ヘッダー
│   ├── HandoverSection.tsx / SoapSection.tsx / TimelineSection.tsx / MedicationSection.tsx
│   ├── PatientTabs.tsx / PatientForm.tsx / DiagnosisSelector.tsx / ConfirmDialog.tsx ...
├── data/                # 選択肢・疾患テンプレート・Demo Data
├── domain/              # 集計（Dashboard/一覧）、タイムライン生成、デモ閾値、アレルギー解析
├── hooks/               # useAppData（状態・CRUD・保存）、useHashRoute ほか
├── pages/               # Dashboard / PatientList / NewPatient / PatientDetail / DataManagement / NotFound
├── types/               # 型定義
└── utils/               # storage（永続化・マイグレーション）、route、validation、date、id
```

---

## ライセンス / 利用範囲

学習・ポートフォリオ用途のデモ作品です。実際の医療現場での利用は想定していません。
