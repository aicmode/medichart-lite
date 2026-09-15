/** 常時表示する医療安全上の注意書き（補足ランドマークとして支援技術からも到達できるようにする） */
export function DisclaimerBanner() {
  return (
    <aside className="disclaimer" aria-label="利用上の注意">
      <span className="disclaimer__icon" aria-hidden="true">
        !
      </span>
      <p className="disclaimer__text">
        このアプリは学習・デモ用途です。実際の診療、看護判断、患者情報の管理には使用しないでください。登録するデータは必ず架空情報を使用してください。
      </p>
    </aside>
  );
}
