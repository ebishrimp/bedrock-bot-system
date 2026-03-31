# bedrock-bot-system

## 概要
`bedrock-protocol` を使って Bedrock Dedicated Server に静的 bot をログインさせ、ゲーム内チャットコマンドで操作できる骨組みです。

## セットアップ
1. `npm install`
2. `src/config.json` の `server`, `bots`, `control` を環境に合わせて編集
3. `npm start`

## 使い方（ターミナル操作）
- `!bot login <name>`: botログイン
- `!bot logout <name>`: botログアウト
- `!bot create <name> [x y z]`: bot作成（設定済み名前が無ければ追加）
- `!bot tp <name> <x> <y> <z>`: botテレポート
- `!bot command <name> <server command>`: botとしてコマンド実行
- `!bot list`: bot状態表示
- `list`: 簡易一覧
- `exit`: 終了

## ゲーム内コマンド接続案
`server` のチャットを監視して下記テキストを `commandHandler` へ流せば、チートOFFでもプレイヤーから操作可能。
- `!bot login bot1`
- `!bot tp bot1 100 70 -50`

## TODO
- 公式MSアカウント認証（`onlineMode=true` とトークン管理）
- 重複ログインや再接続制御
- bot一覧GUI / 隠す機能
- クリック式座標指定・死亡復帰

