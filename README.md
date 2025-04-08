# 自走棋對戰遊戲

一款基於React和Firebase的自走棋對戰遊戲，版本 v0.2.2

## 遊戲介紹

這是一款雙人對戰的自走棋遊戲，遊戲特點：

- 5x5棋盤，玩家從棋盤兩側開始
- 每個角色有獨特的卡牌池
- 每回合從卡池抽取10張卡，選擇3張進行戰鬥
- 卡牌分為移動和攻擊兩種類型
- 攻擊卡有3x3的攻擊範圍，可造成不同傷害

## 線上演示

遊戲線上演示版本：[https://yanchen184.github.io/auto-chess-battle](https://yanchen184.github.io/auto-chess-battle)

## 技術架構

- 前端：React + styled-components
- 後端/數據庫：Firebase (Firestore + Realtime Database)
- 狀態管理：React Context API
- 路由：React Router

## 如何開始

1. 複製儲存庫：
   ```
   git clone https://github.com/yanchen184/auto-chess-battle.git
   cd auto-chess-battle
   ```

2. 安裝依賴：
   ```
   npm install
   ```

3. 啟動開發服務器：
   ```
   npm start
   ```

4. 在瀏覽器打開 [http://localhost:3000](http://localhost:3000)

## Firebase 配置

本項目使用 Firebase 進行後端服務，已經配置好了相關檔案：

- `src/firebase/config.js`: Firebase Web App 配置
- `firebase.json`: Firebase 專案配置
- `firestore.rules`: Firestore 安全規則
- `database.rules.json`: Realtime Database 安全規則
- `firestore.indexes.json`: Firestore 索引配置

如果需要部署到自己的 Firebase 專案，請按照以下步驟操作：

1. 安裝 Firebase CLI：
   ```
   npm install -g firebase-tools
   ```

2. 登入 Firebase：
   ```
   firebase login
   ```

3. 初始化您的 Firebase 專案：
   ```
   firebase init
   ```

4. 部署到 Firebase：
   ```
   firebase deploy
   ```

## 部署到 GitHub Pages

本項目已配置好 GitHub Actions 自動部署到 GitHub Pages。每次推送到 `main` 分支後，GitHub Actions 會自動構建並部署到 `gh-pages` 分支。

如需手動部署，可以執行：
```
npm run deploy
```

## 遊戲功能

### 已完成功能
- 角色選擇（戰士、法師、盜賊）
- 遊戲對戰配對系統
- 卡牌選擇與使用界面
- 棋盤顯示與操作
- 玩家狀態顯示
- 攻擊模式視覺化

### 開發中功能
- 回合執行動畫效果
- 遊戲歷史記錄
- 角色技能系統
- 遊戲排行榜

## 遊戲規則

1. **開始遊戲**：玩家選擇角色後可以創建或加入一個遊戲。
2. **準備階段**：每位玩家從自己的卡牌池中抽取10張卡牌，然後選擇3張用於本回合。
3. **行動階段**：雙方玩家的行動同時執行，按照以下順序：先執行移動卡，再執行攻擊卡。
4. **結算階段**：計算攻擊傷害，更新玩家生命值和魔力值。
5. **勝負條件**：當一方玩家生命值歸零時，遊戲結束，另一方獲勝。

## 聯繫與支持

如有問題或建議，請提交Issue或Pull Request。
