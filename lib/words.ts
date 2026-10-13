export type CodeLang = 'Python' | 'HTML' | 'JavaScript' | 'CSS' | 'SQL' | 'Shell'

export type Word = {
  /** 画面の見出し。用語は日本語の意味、コードはその1行が何をするかの説明 */
  display: string
  /**
   * 実際に打つ文字列。
   * 用語は小文字の英単語。大文字で打っても通す。
   * コードは書いてあるとおりの1行。記号も大文字小文字も1文字ずつそのまま照合する。
   */
  keys: string
  /** コードのときだけ付く。付いていれば、大文字小文字も記号もそのまま照合する */
  lang?: CodeLang
}

/** IT の英単語。打つのは英語、見出しは日本語の意味 */
export const TERMS: readonly Word[] = [
  { display: '変数', keys: 'variable' },
  { display: '関数', keys: 'function' },
  { display: '配列', keys: 'array' },
  { display: '文字列', keys: 'string' },
  { display: '整数', keys: 'integer' },
  { display: '真偽値', keys: 'boolean' },
  { display: '条件', keys: 'condition' },
  { display: '繰り返し', keys: 'loop' },
  { display: '再帰', keys: 'recursion' },
  { display: '例外', keys: 'exception' },
  { display: '継承', keys: 'inheritance' },
  { display: 'インターフェース', keys: 'interface' },
  { display: 'データベース', keys: 'database' },
  { display: 'アルゴリズム', keys: 'algorithm' },
  { display: 'オブジェクト', keys: 'object' },
  { display: 'カプセル化', keys: 'encapsulation' },
  { display: 'コンパイル', keys: 'compile' },
  { display: 'デバッグ', keys: 'debug' },
  { display: 'リファクタリング', keys: 'refactoring' },
  { display: 'プルリクエスト', keys: 'pull request' },
  { display: 'コミット', keys: 'commit' },
  { display: 'ブランチ', keys: 'branch' },
  { display: 'マージ', keys: 'merge' },
  { display: '依存関係', keys: 'dependency' },
  { display: '環境', keys: 'environment' },
  { display: '単体テスト', keys: 'unit test' },
  { display: '非同期', keys: 'asynchronous' },
  { display: 'コールバック', keys: 'callback' },
  { display: 'プロミス', keys: 'promise' },
  { display: 'ジェネリクス', keys: 'generics' },
  { display: 'スタック', keys: 'stack' },
  { display: 'キュー', keys: 'queue' },
  { display: 'ヒープ', keys: 'heap' },
  { display: '二分探索', keys: 'binary search' },
  { display: 'ハッシュテーブル', keys: 'hash table' },
  { display: '計算量', keys: 'complexity' },
  { display: 'ポインタ', keys: 'pointer' },
  { display: '参照', keys: 'reference' },
  { display: 'ガベージコレクション', keys: 'garbage collection' },
  { display: 'メモリリーク', keys: 'memory leak' },
  { display: 'デッドロック', keys: 'deadlock' },
  { display: '正規表現', keys: 'regular expression' },
  { display: '型推論', keys: 'type inference' },
  { display: 'オーバーフロー', keys: 'overflow' },
  { display: '文字コード', keys: 'encoding' },
  { display: '初期化', keys: 'initialize' },
  { display: '認証', keys: 'authentication' },
  { display: '公開鍵', keys: 'public key' },
  { display: '秘密鍵', keys: 'private key' },
  { display: '暗号化', keys: 'encryption' },
  { display: 'フロントエンド', keys: 'frontend' },
  { display: 'バックエンド', keys: 'backend' },
  { display: 'コンテナ', keys: 'container' },
  { display: '仮想マシン', keys: 'virtual machine' },
  { display: 'デプロイ', keys: 'deploy' },
  { display: 'リポジトリ', keys: 'repository' },
  { display: 'フレームワーク', keys: 'framework' },
  { display: 'ライブラリ', keys: 'library' },
  { display: 'サーバー', keys: 'server' },
  { display: 'ネットワーク', keys: 'network' },
]

/**
 * 1行で完結するコード。改行は入れない。
 * 打てる文字は半角の英数字と記号と空白だけ。
 * バックスラッシュとバッククォートは、JIS配列の Mac で打ちにくいので使わない。
 */
export const CODES: readonly Word[] = [
  // Python
  { lang: 'Python', display: 'あいさつを表示する', keys: 'print("Hello, world!")' },
  { lang: 'Python', display: '名前を入力してもらう', keys: 'name = input("name: ")' },
  { lang: 'Python', display: '平均点を出す', keys: 'avg = sum(scores) / len(scores)' },
  { lang: 'Python', display: '2倍のリストをつくる', keys: 'x = [i * 2 for i in range(10)]' },
  { lang: 'Python', display: '3回くり返す', keys: 'for i in range(3): print(i)' },
  { lang: 'Python', display: '偶数か調べる', keys: 'if n % 2 == 0: print("even")' },
  { lang: 'Python', display: '足し算の関数', keys: 'def add(a, b): return a + b' },
  { lang: 'Python', display: '乱数のモジュールを読み込む', keys: 'import random' },
  { lang: 'Python', display: '大きい順に並べる', keys: 'nums.sort(reverse=True)' },
  { lang: 'Python', display: 'カンマで区切る', keys: 'words = text.split(",")' },
  { lang: 'Python', display: '辞書をつくる', keys: 'user = {"name": "taro", "age": 20}' },
  { lang: 'Python', display: '名前のない関数', keys: 'double = lambda x: x * 2' },
  { lang: 'Python', display: '直接実行したときだけ動かす', keys: 'if __name__ == "__main__": main()' },
  { lang: 'Python', display: '例外をつかまえる', keys: 'except ValueError as e: print(e)' },
  { lang: 'Python', display: '8文字以上か調べる', keys: 'is_ok = len(password) >= 8' },
  { lang: 'Python', display: 'f文字列で表示する', keys: 'print(f"score: {score}")' },
  { lang: 'Python', display: '無限ループをすぐ抜ける', keys: 'while True: break' },
  { lang: 'Python', display: '日付を扱う', keys: 'from datetime import date' },

  // HTML
  { lang: 'HTML', display: 'HTML5 の宣言', keys: '<!DOCTYPE html>' },
  { lang: 'HTML', display: '大見出し', keys: '<h1>Hello</h1>' },
  { lang: 'HTML', display: 'クラス付きの段落', keys: '<p class="lead">Saga</p>' },
  { lang: 'HTML', display: 'リンクを貼る', keys: '<a href="/about">About</a>' },
  { lang: 'HTML', display: '画像を置く', keys: '<img src="logo.png" alt="logo">' },
  { lang: 'HTML', display: '入力欄', keys: '<input type="text" name="user">' },
  { lang: 'HTML', display: '送信ボタン', keys: '<button type="submit">Send</button>' },
  { lang: 'HTML', display: '箇条書き', keys: '<ul><li>item</li></ul>' },
  { lang: 'HTML', display: '文字コードの指定', keys: '<meta charset="utf-8">' },
  { lang: 'HTML', display: '空の入れ物', keys: '<div id="app"></div>' },
  { lang: 'HTML', display: 'スクリプトを読み込む', keys: '<script src="main.js"></script>' },
  { lang: 'HTML', display: '入力欄のラベル', keys: '<label for="name">Name</label>' },
  { lang: 'HTML', display: 'CSS を読み込む', keys: '<link rel="stylesheet" href="style.css">' },

  // JavaScript
  { lang: 'JavaScript', display: 'コンソールに出す', keys: 'console.log("hello")' },
  { lang: 'JavaScript', display: 'アロー関数', keys: 'const sum = (a, b) => a + b' },
  { lang: 'JavaScript', display: '数える変数をつくる', keys: 'let count = 0' },
  { lang: 'JavaScript', display: '要素をさがす', keys: 'document.querySelector("#app")' },
  { lang: 'JavaScript', display: '全部2倍にする', keys: 'nums.map((n) => n * 2)' },
  { lang: 'JavaScript', display: 'API を呼ぶ', keys: 'await fetch("/api/rankings")' },

  // CSS
  { lang: 'CSS', display: '余白を消す', keys: 'body { margin: 0; }' },
  { lang: 'CSS', display: '横に並べる', keys: 'display: flex;' },
  { lang: 'CSS', display: '文字色を指定する', keys: 'color: #e4ff4a;' },

  // SQL
  { lang: 'SQL', display: '全件取り出す', keys: 'select * from users;' },
  { lang: 'SQL', display: '条件で絞り込む', keys: 'select name from users where age > 20;' },
  { lang: 'SQL', display: '1行追加する', keys: "insert into posts values (1, 'hi');" },

  // Shell
  { lang: 'Shell', display: '変更を記録する', keys: 'git commit -m "fix typo"' },
  { lang: 'Shell', display: 'リモートに送る', keys: 'git push origin main' },
  { lang: 'Shell', display: 'ブランチを切って移る', keys: 'git checkout -b feature' },
  { lang: 'Shell', display: 'ライブラリを入れる', keys: 'pip install requests' },
  { lang: 'Shell', display: '開発サーバを起動する', keys: 'npm run dev' },
  { lang: 'Shell', display: 'Python を実行する', keys: 'python app.py' },
  { lang: 'Shell', display: 'コンテナを起動する', keys: 'docker compose up -d' },
  { lang: 'Shell', display: '隠しファイルまで一覧する', keys: 'ls -la' },
]

export const WORDS: readonly Word[] = [...TERMS, ...CODES]
