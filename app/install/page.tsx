'use client'

import { useRouter } from 'next/navigation'

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  )
}

export default function InstallPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">戻る</span>
          </button>
          <h1 className="text-base font-bold text-gray-900">ホーム画面に追加する</h1>
        </header>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            このアプリをスマートフォンのホーム画面に追加すると、アプリのように起動できます。
          </p>

          {/* iOS */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-white font-bold text-sm">iPhone / iPad（Safari）</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              <Step number={1} text="Safariでこのページを開いてください（Chrome等では追加できません）" />
              <Step number={2} text="画面下部中央の共有ボタン（四角から上矢印が出たアイコン）をタップ" />
              <Step number={3} text="メニューをスクロールして「ホーム画面に追加」を選択" />
              <Step number={4} text="右上の「追加」をタップして完了" />
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <p className="text-xs text-amber-700">⚠️ Safariのみ対応しています。ChromeやLINEのブラウザでは「ホーム画面に追加」が表示されない場合があります。</p>
              </div>
            </div>
          </div>

          {/* Android */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-green-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17.523 15.341a.5.5 0 0 1-.023.094l-1.591 4.932a.5.5 0 0 1-.928.085L13.6 17.5H10.4l-1.381 2.952a.5.5 0 0 1-.928-.085L6.5 15.435a.5.5 0 0 1-.023-.094A6.5 6.5 0 1 1 17.523 15.341zM8.854 3.146a.5.5 0 1 0-.708.708l.5.5a.5.5 0 0 0 .708-.708l-.5-.5zm6 0a.5.5 0 1 0-.708.708l.5.5a.5.5 0 0 0 .708-.708l-.5-.5zM9.5 9a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1zm5 0a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z"/>
              </svg>
              <span className="text-white font-bold text-sm">Android（Chrome）</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              <Step number={1} text="Chromeでこのページを開いてください" />
              <Step number={2} text="右上の「⋮」（メニュー）ボタンをタップ" />
              <Step number={3} text="「ホーム画面に追加」または「アプリをインストール」を選択" />
              <Step number={4} text="「追加」または「インストール」をタップして完了" />
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <p className="text-xs text-blue-700">💡 端末やChromeのバージョンによってメニューの表示が異なる場合があります。「ホーム画面に追加」が見つからない場合はブラウザを最新版に更新してください。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
