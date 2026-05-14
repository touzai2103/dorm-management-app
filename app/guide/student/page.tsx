import Link from 'next/link'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
    <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    {children}
  </section>
)

const Step = ({ num, text }: { num: number; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
      {num}
    </span>
    <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
  </div>
)


export default function StudentGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-gray-900">使い方ガイド</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Section title="食事の申告方法">
          <Step num={1} text="カレンダーから申告したい日付を探します。" />
          <Step num={2} text="「朝食」「夕食」のボタンをタップして切り替えます。緑色になったら「食べる」の申告です。" />
          <Step num={3} text="タップした時点で自動保存されます。保存ボタンは不要です。" />
        </Section>

        <Section title="申告の締切">
          <p className="text-sm text-gray-700 leading-relaxed">
            各日の申告締切は <span className="font-bold text-gray-900">2日前の深夜0時</span> です。
            締切を過ぎた日はグレーアウトされ、変更できなくなります。
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
            例：5月15日（木）の食事は、5月13日（火）の0時が締切です。
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            締切後にどうしても変更が必要な場合は、<span className="font-bold text-gray-900">グループLINEでスタッフに申請</span>してください。
          </p>
        </Section>

        <Section title="表示期間">
          <p className="text-sm text-gray-700 leading-relaxed">
            カレンダーには <span className="font-bold text-gray-900">今日から14日先</span> までの日程が表示されます。
          </p>
        </Section>

        <Section title="ホーム画面への追加">
          <p className="text-sm text-gray-700 leading-relaxed">
            ヘッダーの「ホーム画面に追加」ボタンからスマートフォンのホーム画面にショートカットを追加できます。次回からはアプリのように素早く開けます。
          </p>
        </Section>
      </div>
    </div>
  )
}
