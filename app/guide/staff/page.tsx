import Link from 'next/link'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    {children}
  </section>
)

const Row = ({ label, description }: { label: React.ReactNode; description: string }) => (
  <div className="flex items-center gap-3">
    <div className="shrink-0 w-16 flex justify-center">{label}</div>
    <p className="text-sm text-gray-700">{description}</p>
  </div>
)

export default function StaffGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-gray-900">使い方ガイド（スタッフ）</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Section title="申告一覧表の見方">
          <p className="text-sm text-gray-700 leading-relaxed">
            生徒ごとに今日から14日分の朝食・夕食申告状況が横並びで表示されます。各セルの左が朝食、右が夕食です。
          </p>
          <Row
            label={<span className="text-red-500 text-lg font-bold">●</span>}
            description="食べる（申告済み）"
          />
          <Row
            label={<span className="text-gray-500 text-lg">✕</span>}
            description="食べない（申告済み）"
          />
          <Row
            label={<span className="w-8 h-7 rounded bg-amber-200 inline-block" />}
            description="一度も申告操作されていない日"
          />
          <p className="text-xs text-gray-500 leading-relaxed">
            ※ アンバー色のセルは生徒がまだアプリを操作していない日です。スタッフが状況確認の際の目安にしてください。
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            ※ 生徒の申告はボタンをタップした時点で自動保存されます。保存ボタンはありません。
          </p>
        </Section>

        <Section title="合計行">
          <p className="text-sm text-gray-700 leading-relaxed">
            各列の上部に寮ごとの朝食・夕食の申告人数合計が表示されます。食材の手配や発注の目安にご活用ください。
          </p>
        </Section>

        <Section title="今日・明日のサマリー（スマートフォン）">
          <p className="text-sm text-gray-700 leading-relaxed">
            スマートフォン表示では画面上部に今日・明日の申告人数が大きく表示されます。すぐに人数を確認したいときにご活用ください。
          </p>
        </Section>

        <Section title="CSV出力">
          <p className="text-sm text-gray-700 leading-relaxed">
            ヘッダーの「CSV出力」ボタンから今日から14日分の申告データをCSV形式でダウンロードできます。
          </p>
        </Section>

        <Section title="生徒情報の管理">
          <p className="text-sm text-gray-700 leading-relaxed">
            一覧表の生徒名をタップすると、その生徒の詳細情報（氏名・フリガナ・部屋番号・部活など）を編集できます。
          </p>
        </Section>

        <Section title="スタッフの追加・権限管理">
          <p className="text-sm text-gray-700 leading-relaxed">
            ページ下部の「スタッフ管理」からスタッフアカウントの承認・権限変更・削除が行えます。
          </p>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p><span className="font-bold">管理者</span>…すべての操作が可能</p>
            <p><span className="font-bold">閲覧者</span>…申告一覧の閲覧とCSV出力のみ可能</p>
          </div>
        </Section>
      </div>
    </div>
  )
}
