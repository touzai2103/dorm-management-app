import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* 浮かび上がるZ */}
        <span className="animate-float-z1 absolute top-0 right-4 text-2xl font-bold text-gray-400 select-none">Z</span>
        <span className="animate-float-z2 absolute top-1 right-9 text-lg font-bold text-gray-300 select-none">z</span>
        <span className="animate-float-z3 absolute top-3 right-14 text-sm font-bold text-gray-200 select-none">z</span>

        {/* ロゴ（呼吸するようにゆっくり拡縮） */}
        <div className="animate-breathe">
          <Image src="/logo.png" alt="ロゴ" width={96} height={96} priority />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400 animate-pulse">読み込み中...</p>
    </div>
  )
}
