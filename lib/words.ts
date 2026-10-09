export type CodeLang = 'Python' | 'HTML' | 'JavaScript' | 'CSS' | 'SQL' | 'Shell'

export type Word = {
  /** 画面の見出し。コードのときは、その1行が何をするかの説明 */
  display: string
  /**
   * 実際に打つ文字列。
   * 用語はローマ字で、長音の「ー」はハイフン。ゆれ表記（shi / si など）も受け付ける。
   * コードは書いてあるとおりの1行。記号も大文字小文字も1文字ずつそのまま照合する。
   */
  keys: string
  /** コードのときだけ付く。付いていれば、そのまま照合する */
  lang?: CodeLang
}

/** プログラミングのことば。 */
export const TERMS: readonly Word[] = [
  { display: '変数', keys: 'hensuu' },
  { display: '関数', keys: 'kansuu' },
  { display: '配列', keys: 'hairetu' },
  { display: '文字列', keys: 'mojiretu' },
  { display: '整数', keys: 'seisuu' },
  { display: '小数点', keys: 'shousuuten' },
  { display: '条件分岐', keys: 'joukenbunki' },
  { display: '繰り返し', keys: 'kurikaesi' },
  { display: '再帰呼び出し', keys: 'saikiyobidashi' },
  { display: '例外処理', keys: 'reigaishori' },
  { display: '継承', keys: 'keishou' },
  { display: '抽象クラス', keys: 'chuushoukurasu' },
  { display: 'インターフェース', keys: 'inta-fe-su' },
  { display: 'データベース', keys: 'de-tabe-su' },
  { display: 'アルゴリズム', keys: 'arugorizumu' },
  { display: 'オブジェクト指向', keys: 'obujekutoshikou' },
  { display: 'カプセル化', keys: 'kapuseruka' },
  { display: 'コンパイル', keys: 'konpairu' },
  { display: 'デバッグ', keys: 'debaggu' },
  { display: 'リファクタリング', keys: 'rifakutaringu' },
  { display: 'プルリクエスト', keys: 'pururikuesuto' },
  { display: 'コミットする', keys: 'komittosuru' },
  { display: 'ブランチを切る', keys: 'burantiwokiru' },
  { display: 'マージする', keys: 'ma-jisuru' },
  { display: '依存関係', keys: 'izonkankei' },
  { display: '環境変数', keys: 'kankyouhensuu' },
  { display: '単体テスト', keys: 'tantaitesuto' },
  { display: '非同期処理', keys: 'hidoukishori' },
  { display: 'コールバック', keys: 'ko-rubakku' },
  { display: 'プロミス', keys: 'puromisu' },
  { display: 'ジェネリクス', keys: 'jenerikusu' },
  { display: 'スタック', keys: 'sutakku' },
  { display: 'キュー', keys: 'kyu-' },
  { display: 'ヒープ', keys: 'hi-pu' },
  { display: '二分探索', keys: 'nibuntansaku' },
  { display: 'ハッシュテーブル', keys: 'hasshute-buru' },
  { display: '計算量', keys: 'keisanryou' },
  { display: 'ポインタ', keys: 'pointa' },
  { display: '参照渡し', keys: 'sanshouwatashi' },
  { display: '値渡し', keys: 'ataiwatashi' },
  { display: 'ガベージコレクション', keys: 'gabe-jikorekushon' },
  { display: 'メモリリーク', keys: 'memoriri-ku' },
  { display: 'デッドロック', keys: 'deddorokku' },
  { display: '正規表現', keys: 'seikihyougen' },
  { display: '型推論', keys: 'katasuiron' },
  { display: 'コンパイルエラー', keys: 'konpairuera-' },
  { display: 'スタックトレース', keys: 'sutakkutore-su' },
  { display: 'オーバーフロー', keys: 'o-ba-furo-' },
  { display: '文字コード', keys: 'mojiko-do' },
  { display: '初期化', keys: 'shokika' },
  { display: '一致する', keys: 'ittisuru' },
  { display: 'マッチする', keys: 'mattisuru' },
  { display: '認証する', keys: 'ninshousuru' },
  { display: '公開鍵', keys: 'koukaikagi' },
  { display: '秘密鍵', keys: 'himitukagi' },
  { display: '暗号化', keys: 'angouka' },
  { display: 'フロントエンド', keys: 'furontoendo' },
  { display: 'バックエンド', keys: 'bakkuendo' },
  { display: 'コンテナ', keys: 'kontena' },
  { display: '仮想マシン', keys: 'kasoumasin' },
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
