# 更新日誌

所有對此項目的顯著更改都將記錄在此文件中。

## [0.2.2] - 2025-04-08

### 修復
- 修復 Game.js 中 `setGameDoc is not defined` 連結錯誤

## [0.2.1] - 2025-04-08

### 修復
- 修復 ESLint 警告，解決未使用變量和依賴項問題
- 修改 Admin.js 中未使用的 characters 和 setCharacters 變量
- 修改 Game.js 中未使用的變量和函數：isValidMove, calculateAttackEffect, currentGame 等
- 修改 Home.js 中未使用的 uuidv4 引用
- 修改 gameService.js 中未使用的 gamesQuery 和 movesQuery 變量
- 修復 Game.js 中 useEffect 的依賴項問題

## [0.2.0] - 初始版本

### 特性
- 基本的自走棋對戰系統
- 角色選擇功能
- 卡牌選擇和使用界面
- 5x5 棋盤遊戲區域
- 實時對戰功能
- Firebase 後端整合
