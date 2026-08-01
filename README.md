# MediChart Lite

> ⚠️ **このアプリは学習・デモ用途です。実際の診療、看護判断、患者情報の管理には使用しないでください。登録するデータは必ず架空情報を使用してください。**

MediChart Lite は、看護師経験を活かした医療系 Web アプリのポートフォリオ作品として制作した、**簡易電子カルテ風のデモアプリケーション**です。
患者情報・疾患・バイタルサイン・看護記録を、ブラウザだけで登録・閲覧・編集・削除できます。

サーバーもデータベースもログイン機能も持たず、データはすべて閲覧しているブラウザの Local Storage に保存されます。

---

## 医療安全上の注意

このアプリは医療機器ではなく、電子カルテとして正式に利用できるものでもありません。
学習・デモ・ポートフォリオの目的でのみ利用してください。

- **実在する患者の情報は絶対に入力しないでください。** 入力するデータは必ず架空情報にしてください。
- 本アプリには **診断機能・治療提案・投薬提案・医療判断を行う機能は一切実装していません。**
- バイタルサインの入力欄には範囲チェックがありますが、これは明らかな入力ミスを防ぐためのものであり、**正常・異常の判定ではありません。**
- 疾患名テンプレートは入力の手間を減らすための定型文言であり、診断を示すものではありません。
- データはブラウザ内にのみ保存され、外部へ送信されません。同時に、ブラウザのデータを消去すると復元できません。
- 実際の診療・看護業務では、必ず所属施設が正式に導入したシステムを使用してください。

注意書きは、アプリ実行中は常に画面上部へ表示されます。

---

## 主な機能

### Dashboard
- 登録患者数 / 本日の記録件数 / 登録されている疾患数 / 最新記録日時のサマリー表示
- 最近更新された患者の一覧（選択すると詳細画面へ移動）
- データが無い場合の空状態表示

### Patients
- 登録患者の一覧表示（患者ID・氏名・年齢・性別・病室・主な疾患・最終更新日時）
- 患者ID / 氏名による検索（前後の空白と大文字・小文字の違いを無視）
- 検索結果が 0 件の場合のメッセージ表示
- スマートフォン幅では表を自動的にカード表示へ切り替え

### New Patient
- 患者の新規登録（患者ID・氏名・生年月日・性別・病室・血液型・アレルギー・既往歴・主訴・疾患名・備考）
- 患者IDと氏名は必須。空白のみの入力は不可
- 患者IDの重複登録を防止（重複時はエラーメッセージを表示）
- 生年月日からの年齢自動計算、未来日の入力を禁止
- 登録完了後は患者詳細画面へ移動し、完了メッセージを表示

### Diagnosis Templates
- 17 種類の疾患名テンプレートから複数選択
- テンプレートにない疾患名の自由入力追加（前後空白を除去、空文字は追加不可）
- 選択済み疾患をタグ表示し、重複追加を防止。タグから個別削除が可能

### Patient Detail
- Patient Overview / Diagnoses / Vital Signs / Nursing Notes / Medical Information の各セクション
- 患者情報の編集（患者ID変更時も重複チェック、保存・キャンセル、更新日時の自動保存）
- 患者の削除（氏名を表示した確認ダイアログを経て、関連するバイタル・看護記録も同時に削除）

### Vital Signs
- 測定日時（初期値は現在日時）、体温、収縮期／拡張期血圧、脈拍、呼吸数、SpO₂、意識レベル、疼痛スケール、メモ
- 数値の範囲チェック（体温 25〜45 / 収縮期血圧 40〜300 / 拡張期血圧 20〜200 / 脈拍 20〜250 / 呼吸数 5〜80 / SpO₂ 50〜100 / 疼痛スケール 0〜10）
- 最新バイタルを上部に表示し、過去のバイタルを新しい順に履歴表示
- 個別削除（確認ダイアログあり）

### Nursing Notes
- 記録日時（初期値は現在日時）、記録者名、記録種別（SOAP / 経過記録 / 観察記録 / ケア実施 / 申し送り / その他）、記録本文
- 記録本文は必須・複数行入力
- 保存した記録を新しい順に表示し、保存後はフォームを初期化
- 個別削除（確認ダイアログあり）

### Sample Data
- 初回起動時のみ、架空患者 2 名（PT-0001 山田 太郎 / PT-0002 佐藤 花子）とその記録例を自動登録
- 投入済みフラグを保存するため、再読み込みしても重複追加されません

---

## 使用技術

| 分類 | 内容 |
| --- | --- |
| フレームワーク | React 19 |
| 言語 | TypeScript |
| ビルドツール | Vite 8 |
| スタイル | CSS（プレーン、UI ライブラリ不使用） |
| データ保存 | ブラウザの Local Storage |
| Lint | oxlint |
| パッケージ管理 | npm |

外部データベース・外部 API・ログイン機能・ルーティングライブラリは使用していません。
画面切り替えは React の state による自前の切り替えで実装しています。

---

## セットアップ方法

事前に Node.js（18 以上、開発環境では v24 を使用）と npm が必要です。

```bash
git clone https://github.com/<your-account>/medichart-lite.git
cd medichart-lite
npm install
```

## 開発サーバー起動方法

```bash
npm run dev
```

起動後、ターミナルに表示される URL（既定では http://localhost:5173/ ）をブラウザで開きます。

## Build 方法

```bash
npm run build     # 型チェック（tsc -b）＋本番ビルドを実行し dist/ を生成
npm run preview   # ビルド結果をローカルで確認
```

## その他のコマンド

```bash
npm run typecheck  # TypeScript の型チェックのみ
npm run lint       # oxlint による静的解析
```

---

## データ保存方式

- すべてのデータ（患者情報・疾患・バイタル・看護記録）は、`medichart-lite:app-data:v1` というキーで **ブラウザの Local Storage** に JSON 形式で保存されます。
- 外部サーバーへの送信は一切行いません。
- ブラウザを再読み込みしてもデータは保持されます。別のブラウザ・別の端末・シークレットウィンドウとはデータを共有しません。
- Local Storage の読み書きは [`src/utils/storage.ts`](src/utils/storage.ts) に集約しています。
- 保存データが壊れていて JSON の解析に失敗した場合でもアプリはクラッシュせず、警告を出したうえで初期データから復帰します。想定外の形のレコードは読み込み時に破棄されます。
- データを消したい場合は、ブラウザの開発者ツールから該当キーを削除するか、サイトデータを消去してください。

保存されるデータ構造の概要:

```ts
interface AppData {
  version: number;
  patients: Patient[];
  vitalSigns: VitalSign[];    // patientId で Patient.id を参照
  nursingNotes: NursingNote[]; // patientId で Patient.id を参照
  sampleDataLoaded: boolean;   // サンプルデータの重複投入を防ぐフラグ
}
```

---

## ディレクトリ構成

```
medichart-lite/
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── .oxlintrc.json
├── public/
│   └── favicon.svg
└── src/
    ├── components/
    │   ├── ConfirmDialog.tsx      # 削除前の確認ダイアログ
    │   ├── DiagnosisSelector.tsx  # 疾患テンプレート選択・自由入力・タグ管理
    │   ├── DisclaimerBanner.tsx   # 常時表示の注意書き
    │   ├── EmptyState.tsx         # 空状態表示
    │   ├── Header.tsx             # ページ見出し
    │   ├── Layout.tsx             # サイドバー＋メインの共通レイアウト
    │   ├── NursingNoteForm.tsx    # 看護記録の入力
    │   ├── NursingNoteList.tsx    # 看護記録の一覧
    │   ├── PatientForm.tsx        # 患者の登録・編集フォーム（共通）
    │   ├── Sidebar.tsx            # ナビゲーション
    │   ├── Toast.tsx              # 登録・更新・削除のフィードバック
    │   ├── VitalSignForm.tsx      # バイタルの入力
    │   └── VitalSignHistory.tsx   # 最新バイタルと履歴
    ├── data/
    │   ├── diagnosisTemplates.ts  # 疾患名テンプレート
    │   ├── options.ts             # 性別・血液型・記録種別などの選択肢
    │   └── sampleData.ts          # 初回起動時の架空サンプルデータ
    ├── hooks/
    │   └── useAppData.ts          # 状態管理と CRUD、Local Storage 同期
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── NewPatient.tsx
    │   ├── PatientDetail.tsx
    │   └── PatientList.tsx
    ├── types/
    │   └── index.ts               # Patient / VitalSign / NursingNote / AppData など
    ├── utils/
    │   ├── date.ts                # 日付・日時の変換と年齢計算
    │   ├── id.ts                  # crypto.randomUUID とフォールバックのID生成
    │   ├── storage.ts             # Local Storage 入出力
    │   └── validation.ts          # 入力検証とバイタルの許容範囲
    ├── App.tsx                    # 画面切り替えとフィードバック管理
    ├── index.css                  # 全体スタイル（白・ネイビー・ブルー基調）
    └── main.tsx
```

---

## 設計上のポイント

- **型定義の明確化**: `Patient` / `VitalSign` / `NursingNote` / `Gender` / `BloodType` / `RecordType` / `AppData` を [`src/types/index.ts`](src/types/index.ts) に定義し、`any` を使用していません。
- **ID生成のフォールバック**: `crypto.randomUUID` が使えない環境では `crypto.getRandomValues` による UUID v4 生成、それも使えなければ時刻＋乱数の組み合わせにフォールバックします。
- **入力検証**: 必須項目、空白のみの入力、患者IDの重複、疾患名の重複、数値の範囲を検証し、エラーは該当入力欄の直下に表示します。
- **二重保存の防止**: 各フォームは送信中フラグでボタンを無効化し、連打による重複登録を防ぎます。
- **アクセシビリティ**: `label` と入力欄の関連付け、`aria-invalid` / `aria-describedby` によるエラーの関連付け、アイコンのみのボタンへの `aria-label`、キーボード操作とフォーカスリングの確保を行っています。
- **レスポンシブ**: PC ではサイドバー＋メイン画面、960px 以下ではヘッダー型ナビ、720px 以下では表をカード表示へ切り替えます。

---

## ライセンス / 利用範囲

学習・ポートフォリオ用途のデモ作品です。実際の医療現場での利用は想定していません。
