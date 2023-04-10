# KPT

## Keep

- Demoscene全力で殴った
  - ちゃんとシーンに火を灯せましたかね
- 〆切に対してかなり余裕を持って完成させられた
  - パーティー当日は微調整するくらいで迎えられた
- 理想のディレクションに向かって一直線な作品ができた
  - めっちゃ大事よ
- コードで音楽作るのたのしい！
  - 理屈通りに音が変化してくれるのが一番良い
  - メロディをつけたり複雑なリズムを手書きしない限りは、やっぱり僕はコードが一番直感的
- Machine Liveのインプットをしっかり行ったのは良かった
  - [Syntakt](https://www.elektron.se/en/syntakt-explorer)買ったのは、音作りの面でもパフォーマンス設計の面でもだいぶ良かった。もう全然使ってないけど……
- [Cyclic Noise](https://scrapbox.io/0b5vr/Cyclic_Noise)によるWavetable Synthesis
  - Cyclic Noiseの出音良すぎ
- ロード画面しっかり作り込めた
  - おしゃれにAcid Graphicsのフライヤー風味に仕上げられた
- ありがとうPinterest
- ポリゴンとレイマーチングを駆使したモデリング
  - キーボードとかよくできた
  - やはり描画負荷が高いのは欠点ではある
- Depth of Field良かった
  - [Next Generation Post Processing in Call of Duty: Advanced Warfare](https://advances.realtimerendering.com/s2014/)見ながら実装した
  - しっかり印象的なDoFに仕上がった
- 今回もstallなくスムーズに60FPSで動作してくれた
  - 参考記事: [WebGL: シェーダのコンパイルが描画開始時に発生してstallする](https://scrapbox.io/0b5vr/WebGL:_%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%80%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%8C%E6%8F%8F%E7%94%BB%E9%96%8B%E5%A7%8B%E6%99%82%E3%81%AB%E7%99%BA%E7%94%9F%E3%81%97%E3%81%A6stall%E3%81%99%E3%82%8B)
- TypeScriptシェーダはめちゃくちゃ容量削減に貢献してそう
  - [Shader Minifier](https://github.com/laurentlb/Shader_Minifier)の短所である、ファイル間のトークンの命名の違いによる圧縮効率の悪化を[terser](https://terser.org/)を使ってすんなり解決してくれる
  - ノイズやレイマーチングなどのコードをモジュールとして持っておけるのはめちゃくちゃ便利
- [terser](https://terser.org/)による強力なminification
  - 途中、WebGL拡張やWebAudioのトークンをterserが認識してくれなかったもんで、PRを送ったりもしました。えらい

## Problem

- 1年近くも誰にも相談できない創作活動をし続けるのはだいぶしんどかった……
  - メガデモを一人でやるのは間違い
  - 他人目線でフィードバックを得られないのは苦しい
  - やっぱり仲間を作ったほうが良い
- ややディレクションが独りよがりか
  - Demoscene・Live Coding畑の人には刺さると思うが、万人受けするかと言われるとちょっとな
  - まあ自分が楽しければそれでいいんですけど
- ライブコーディングの体裁、見ててやや分かりづらいか
  - コピペ多用のスタンスは、テクノ体験的に成立させるためには仕方がなかったが、もっとコードを目で追っていきやすいアプローチもあったのかなあ
- テクノお勉強が足りなかった
  - もっといい音出せる気がする
- 音楽のリアルタイム生成
  - あんまりリアルタイムにする意味がない
  - たまに音飛びが発生するのが最悪
  - HMRに対応していたので、制作中のイテレーションは回しやすかった
- 絵の手数が少ない
  - もっといろんなベクトルの絵が出せても良い
- 八分木トンネルパストレシーン、TemporalにNoisy
  - Temporalまで面倒見るDenoiserを用意できなかった
- FXAAが鋭角を潰す
  - たぶんもっと良いAAを用意すべき
- TypeScriptでシェーダ書くのしんどい……
  - 演算子オーバーロードないの辛すぎるよ
  - やはり既存のシェーダ資産をそのまま流用できるという意味で、GLSLで書けるのが一番ではあるよ
- 自作エンジンを用いたコードが煩雑
  - 1エフェクト挿入するのにかなり手間がかかる
  - できれば[Processing](https://processing.org/)のインタフェースくらいお手軽になって欲しい
- Hot Module Replacementが甘い
  - シェーダ側はHMRを入れるのが簡単だったからバンバンイテレーションを回せたが、CPU側のコードが全然対応できていなかった
- Firefoxがなかなか[DecompressionStream API](https://developer.mozilla.org/ja/docs/Web/API/DecompressionStream)に対応してくれない
  - [jsexe](https://www.pouet.net/prod.php?which=59298)ではなく[compeko](https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b)というスクリプトを用いてJavaScriptを圧縮しています
  - もうSafariも対応したよ、対応してないのお前だけだよ、Firefox

## Try

- チームでDemoを作る
  - 一旦、他の人の4kに音楽つけるとかから始めても良さそう
- ライブコーディングコンセプトのDemoはもうちょっと擦っても良い気がしている
- 本当のライブコーディングパフォーマンスもやってみたい！
- 普通のライブコーディング環境ももっと触ったほうが良い
  - TidalCyclesとか絶対触り足りない
- 音楽、GLSLから離れてみる
  - さすがにフィルターやリバーブ等が使えないステートレスな環境にも限界を感じてきた
  - とはいえ、ステートレスってのもチップチューン的で面白いとは思っている
- 物理モデリングシンセ
  - きれいなピアノの音とか出してみたい
- Temporalなフィルターエフェクト
  - 具体的には、Temporal AA・Temporalにも効くDenoiser・Motion Blur
  - ちゃんとMotion Vectorを導入してやる
- [Linearly Transformed Cosines](https://eheitzresearch.wordpress.com/415-2/)
  - 今回はImage Based Lightingでごまかしたが、やはりエリアライトちゃんと使ってみたい
- Ambient Occlusion
  - もっと速くてきれいな手法を試してみる
  - [Screen-Space Far-Field Ambient Obscurance](http://wili.cc/research/ffao/)気になってる
- より便利なシェーダフォーマット
  - 理想: GLSLとの互換性が高く、Minificationに強く、かつモジュラー
  - Wasm・Dartあたりを調査してみたい
- より高い圧縮効率・分析しやすい圧縮フォーマット
  - 今後、[squishy](https://logicoma.io/squishy/)や[crinkler](https://github.com/runestubbe/Crinkler)を見ながら勉強してみようかな……
