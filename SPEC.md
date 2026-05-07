# 寮生食事申告アプリ 仕様書

## 概要
高校生寮生が朝食・夕食の有無を自己申告するWebアプリ。
請求・注文データとの連携なし。AppSheetからの独自開発移行の試験運用。

## 技術スタック
- Next.js（App Router）
- Supabase（Auth + Database）
- Tailwind CSS
- Vercel（ホスティング予定）

## 認証
- LINEログイン（OAuth）
- Googleログイン（OAuth）
- 初回ログイン時に氏名・部屋番号を自己申告
- 管理者が後から内容を確認・修正する運用

## 申告ルール
- 申告単位：日ごと
- 表示範囲：今日〜10日先
- 締切：対象日の2日前23:59まで（暦日）
- デフォルト：朝食・夕食ともに「食べない」（false）
- 締切済みの日はグレーアウト・操作不可

## データベース（Supabase）
テーブルは作成済み・RLS有効済み

### studentsテーブル
- id: UUID PK
- name: TEXT
- room_number: TEXT
- created_at: TIMESTAMPTZ

### student_auth_linksテーブル
- id: UUID PK
- student_id: UUID（students参照）
- auth_uid: UUID
- provider: TEXT
- created_at: TIMESTAMPTZ

### meal_declarationsテーブル
- id: UUID PK
- student_id: UUID（students参照）
- date: DATE
- breakfast: BOOLEAN
- dinner: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE(student_id, date)

## 現在の進捗
- [x] Supabaseプロジェクト作成（Dorm Management App）
- [x] テーブル作成・RLS設定済み
- [x] Next.jsプロジェクト作成（dorm-management-app）
- [x] @supabase/supabase-js @supabase/ssr インストール済み
- [x] .env.local 作成済み（SUPABASE_URL修正・SITE_URL追加済み）
- [x] utils/supabase/client.ts 作成済み
- [x] utils/supabase/server.ts 作成済み
- [x] proxy.ts 作成済み（セッション自動更新・未認証ルート保護）
- [x] app/auth/callback/route.ts 作成済み（OAuthコールバック処理）
- [x] app/login/page.tsx 作成済み（LINE・Googleログインボタン）
- [x] app/actions/auth.ts 作成済み（Server Actions）
- [x] LINEログイン動作確認済み
- [ ] Googleログイン設定（Google Cloud Console → SupabaseでProvider有効化）
- [ ] 初回ログイン時の氏名・部屋番号登録フロー実装
- [ ] 申告UI実装
- [ ] 管理者画面実装

## OAuth設定手順（残作業）

### Google
1. Google Cloud Console でOAuthクライアントID作成
2. 承認済みリダイレクトURI: `https://<project>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google に Client ID/Secret を入力

### LINE
1. LINE Developers でチャネル（LINEログイン）作成
2. コールバックURL: `https://<project>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → LINE に Channel ID/Secret を入力

### 共通
- Supabase Dashboard → Authentication → URL Configuration → Redirect URLs に追加:
  - `http://localhost:3000/auth/callback`（開発）
  - `https://<本番ドメイン>/auth/callback`（本番）