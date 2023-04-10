# Reflection of 0mix

0mixの振り返り

## Emix

<iframe width="560" height="315" src="https://www.youtube.com/embed/SYG9zU_bd6U" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Emix by Epoch</small></p>

EmixというDemo。Assembly Summer 2015で公開された、7分弱のテクノ音楽で構成されるDemo。

今まで見た中でもっとも"素晴らしい"Demoではない。技術的に突出しているわけではない。なんなら別に、64KBでさえない。
ただ、とても洗練されたDemo。やるべきことが明確で、それを適切に行ったDemo。僕の心の中にずっと住み続けているDemo。

また、Emixの前任者として、 [Medium by Einklang.net](https://youtu.be/wYvn653Fefw) や [X-MIX 2004: Ion Traxx by Kewlers & MFX](https://youtu.be/j5HPZr7gBbY) といったデモが存在する。
いずれも、複数のテクノトラックにより構成されるDJプレイに、VJ的なビジュアルが添えられる作品。
ナイトクラブにおける音楽・映像体験を明確に意識した作品。

私はそこを目指しに行った。

## 64k

64KB Introという戦場。
Windows・Linux・Amiga・Browser等といったプラットフォームごとに、64KBの重みは変わってくる。

<iframe width="560" height="315" src="https://www.youtube.com/embed/O3T1-nadehU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Clean Slate by Conspiracy。質感やディテールにこだわった多彩なオブジェクトを表示するWindows 64KB Intro</small></p>

私の場合は、Browser。
実行ファイルはスクリプトで記述され、バイナリであるWindows等に対してアドバンテージは少ないものの、
ウインドウの初期化は当然いらないし、SVGのレンダリング・OpusのDecode等のAPIが充実している。
最近はDecompressionStreamなんてものも使えるようになった。比較的恵まれた環境である。

とはいえ、音楽・動画のファイルサイズと比較して、64KBというのがあまりに小さすぎる容器であることは、誰でも理解している。
そういう意味で私は、64kとは「ほぼ全てのコンテンツがプロシージャルである」という判子だと思っている。
（最近はみんな平気で64KBに[ブレイクス](https://youtu.be/D2COWeeEqTs)や[ボイスサンプル](https://youtu.be/A6A5ZSdIU5U?t=126)をぶっ込むが……）

プロシージャル技術から生み出される、ジオメトリ・レンダリング・アニメーション・ポスプロ・音楽・そしてMinificationと圧縮……
どれも付け焼き刃ではあるが、一応自分の武器として振れるようにはなってきた。
残念ながら私がこれまで身につけてきてしまった技術スタックをフルに活用できるフィールドが64kくらいしかないのである。

これは呪いだ。

## Techno

私はそこまでテクノに精通しているわけではない。
音ゲーのバックグラウンドがあるので、まあこういう音楽だろうな、というくらいの認識。

今回の作品を作るにあたりインターネットでテクノを掘った。
掘り方が決して適切ではないなとも思うし、これでもまだ不十分であるなという感覚はある。

<iframe width="560" height="315" src="https://www.youtube.com/embed/HOzFF47uYEg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Oscar Muleroによる2時間弱のテクノセット</small></p>

4つ打ちで鳴り続けるキック・地を這うベースの低音の上を、無機質な音が鳴り続ける。
曲を構成していく上で、いかに音を気持ちよく聴かせるか、ということが重要視される。
音から得られる身体的な感覚が唯一の手がかり、とでも言うべきか。

音作りについて、Yan Cook氏がYouTubeにアップロードしている動画群が参考になった。
極めて抽象的な音を、様々なシンセサイザー・エフェクターを用いて作り出す。

<iframe width="560" height="315" src="https://www.youtube.com/embed/hGvDsPVuWPo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Yan Cookによる、Wavetableシンセを用いてテクノのリフを生み出すチュートリアル</small></p>

# Machine Live

Machine Live。
全能のコンピュータを使うのではなく、あえて限られたハードウェアのセットで行われる音楽パフォーマンス。
目の前で物理的感覚を持って操作されるボタンやノブ。ラップトップの上蓋で遮られることのない手札。

<iframe width="560" height="315" src="https://www.youtube.com/embed/yMfbX6714j0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ STOORによる7時間弱のMachine Liveによるテクノのパフォーマンス</small></p>

このデモの制作のため、勉強としてElektron Syntaktを買った。
サンプルが使えなくて、全トラックアナログかデジタルのオシレータで構成される変態マシン。
今回私がやりたかったこととの相性はピッタリだった。

Elektron製品は初めて触ったが、その操作性や哲学には驚かされた。
限られたパラメータで音作りを楽しむ世界観・直感的な操作で複雑なシーケンスプログラムを組める感触。

<iframe width="560" height="315" src="https://www.youtube.com/embed/XCpPdygkts4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Elektron Syntaktの紹介動画</small></p>

さらに、友人にそそのかされてDirtywave M8を買った。
lsdjに影響された、ハンドヘルドの万能Tracker。
チップチューン・減算・ウェーブテーブル・FM・サンプラーと、幅広いインストゥルメントを搭載する。

TrackerのUI自体が初体験だったが、確かにこのインタフェースなら、方向キーとボタン4つだけで曲がしっかり作れるものだなと感心した。

<iframe width="560" height="315" src="https://www.youtube.com/embed/Q6C_eT9bxYE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Dirtywave M8を用いたハウスのパフォーマンス。Yebisu303による</small></p>

どっちも、触って「ぼくはGLSLでいいかな」となった（？？？）。
ただ、パフォーマンスや音作りの参考にはなった。

## GLSL Music

基本となるコンセプトは単純。 `sin( TAU * 440.0 * t )` と書けば、440Hzのサイン波が鳴る。
生成されるすべての音は、そのコンセプトの延長線上に存在する。
[Shadertoy](https://www.shadertoy.com/view/ldfSW2)でGPU Soundを試したことがある方なら、このコンセプト自体は知ってはいるだろう。

本来、ポリゴンに陰影をつけるための言語で、音を生成する。
謎の営み。やる必要がない。

あえて言えば、大量の処理をワンパスに詰め込んでも、並列処理の暴力でなんとかしてくれる。
実際、2500回のforループで大量のサイン波によるAdditive Synthesisを行うコードが存在する。
4KB Introで使われる「Oidos」というシンセサイザーから着想を得た。

<iframe width="560" height="315" src="https://www.youtube.com/embed/vAh7RJxTavY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Wackelkontakt by Alcatraz & Prismbeings。Oidosによる美麗なサウンドはnobyによる</small></p>

GLSLコーダーの頭で、Modular SynthやMachine Liveを再解釈した結果。

特に、Cyclic Noise（フラクタルノイズの一種）を用いて作られた、クラップ・ベース・シンセパッド。
Wavetableシンセから着想を得たアイデア。
本来は、Perlin FBMのテクスチャを使う予定であったが、パフォーマンスのわかりやすさを優先し、テクスチャやサンプルは一切使わない構成とした。

もちろん、シンセサイザーオタク頭でも考える。
FM・Unison・Arpeggio…… GLSLという戦場でも使える道具は使う。

一方で、フィルター・EQ・リバーブといった、通常の楽曲制作では必須となるエフェクトが使用不可能となる。
これらのエフェクトにはStateが必要となるが、GLSL MusicでStateを使うことはできない。

TODO: image

近い境遇を持った楽曲制作環境として、チップチューンが存在する。
リバーブの使えないチップチューンにおいて、音に広がりを持たせるには、複数トラックを活用したディレイを付与することが一例として挙げられる。
また、メガドライブに代表されるFM音源を用いる際は、複数のパートが同じ周波数帯で干渉しないよう、オペレータのパラメータ調整を技巧に行う。

<iframe width="560" height="315" src="https://www.youtube.com/embed/gnQXgr6_YR4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ Overdrive 2 by Titan。メガドライブのFM音源を用いた強烈なドラムンベースはstrobeによる</small></p>

## 8 Minutes

Revisionのレギュレーション上、ひとつのDemoが使える時間はローディング時間を含めて8分。
ローディング時間を除いて7分と20秒、しっかり使い切った。ちなみに140BPMでピッタリ256小節。

7分半に4曲を詰め込む。1曲あたり2分弱。
2分弱と言えば、音ゲー音楽である。
クラブにおける音楽体験を、ゲームセンターにおける1度のゲーム体験（100円・約10分）に詰め込む。
そのためには、本来クラブではあり得ない楽曲展開やテンポが要求される。

<iframe width="560" height="315" src="https://www.youtube.com/embed/UXqXnGW2VWE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ DARK TRAIN - S-Bahn。beatmaniaIIDX 28 BISTROVERに収録された、2分間の本格的テクノトラック</small></p>

140BPMは、おそらくテクノ音楽としてはやや早めである。
また、各セクションの展開は比較的早いペースで進んでいく。

とはいえ、システムの都合上、基本的には16小節のループを加工したものをつなげていくような形。
ライブコーディングの営みの性質、その見せ方・わかりやすさも加味すると、そこまで素早い展開を生み出すことはできない。

## Live Coding

音楽や映像を生成する手段としてのコーディング。
それを視聴者を目前にして行い、ライブパフォーマンスの体裁とする。

コーディングを知らない観衆にとっては、音を生成する黒魔術。
言語や環境に精通した観衆からは、次の展開を予想するための手がかり。

<iframe width="560" height="315" src="https://www.youtube.com/embed/cB_tm-NAYRk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<p><small>▲ 田所淳によるTidalCyclesを用いたテクノのパフォーマンス。Tidalのシーケンスに呼応して変化する映像も田所先生が手掛けている</small></p>

コードを書くのは人間であるから、そこには人間的な不正確さ・限界が存在する。
一度に編集できるコードには時間的な制約が存在し、音楽的に理想の展開を生み出すことは難しい。

頭の中にあるロジックを素早くコードとして落とし込み、実行する。
そのプロセスを加速させる試みは、ライブコーディングに限らずプログラミングの文脈で多く行われている。
入力インタフェースとしては、キーボードとマウス。
より先進的なソフトウェア支援としては、Vimのようなコード内のナビゲーション支援や、IntelliSenseのような構文解析を用いたサジェストなど。

作品としてのわかりやすさ・音楽的なおもしろさ・制作中の編集のしやすさを天秤にかける。
今回は、コピー＆ペーストとブラケットへのジャンプを多用した味付けにした。
田所淳先生の、あらかじめパフォーマンスの展開に必要なコードスニペットがすべてコメントアウトされた状態でコード全文に存在するスタイルを参考にした。

TidalCyclesのようなサンプルベースのライブコーディングDSLを定義する択もあったとは思うが、今回はGLSLを用いて、かつ完全プロシージャルな音作りに制約をかけた。
理由のひとつは、コード上で行える一つ一つの操作がモジュラーシンセと同程度に低レベルで、パフォーマンスとしてわかりやすいこと。
もう一つは、音作りの楽しさ・音が変化することのおもしろさにフォーカスをしたパフォーマンスにしたかったことが挙げられる。

## VJ

もちろん、先に紹介したEmixの存在が、このIntroにVJスタイルのグラフィクスをもたらした要因。

テクノ音楽を引き立てる調味料として存在する映像表現。決して主役ではない。
ただし、ここはDemosceneという箱なので、少しビジュアルの味付けは濃くする。

BOOTHに行くと、VRChat等で活動するVJ達によって作られたVJ素材が多く並んでいる。
ミニマルでかつジェネラティブなアプローチに近い絵が多く見れたので、非常に参考になった。

https://booth.pm/ja/search/VJ%E7%B4%A0%E6%9D%90

映像に色を使うことを検討したが、結局全素材モノクロで統一した。
Emixも含め、テクノのVJをいくつか見てみたときに、1枚に2色以上が含まれるケースが少なかった。
これは単にそういう文法なのかな。

楽曲に合わせて、映像を出す。
実際シーケンスを組んでみると、どのような順番で・どのようなタイミングでこれを出すか、だいぶ難しい。
これってこんなに難しいのでいいんだっけ。

また、楽曲の雰囲気に合わせて、ポストプロセッシングのカラーグレーディングを調整する。
カラーグレーディングの本を買って読んでみたものの、VJ的な映像に対する答えは「トレンドを捉える」程度のことしか提示されなかった。
フィーリングを信じろ。

## Direction

nobyによるエッセイ「A Critical Look at the Demoscene」を最近読んだ。
Demosceneで2002年以降に用いられる「Direction」という用語についての議論を中心に、2021年時点でのDemosceneにおける作品の評価そのものに対して批評的に述べたエッセイ。

https://prismbeings.com/direction/

私はこれを呼んで、「Direction」とは「意志」であると解釈した。
作品には、作品が生まれなければいけなかった理由がある。
その理由の力強さ・そして理由を視聴者にどれだけ効率的に伝えられているか、その評価軸が「Direction」という語彙で表現されていると思った。

この作品におけるDirectionとはなにかを箇条書きで反省してみる。
転じて、この作品を通じて伝えたかったことのまとめとなる。

- Live Codingシーンに対しての挑発と敬意
  - Live Codingという音楽パフォーマンスを通じて観衆が感じる「畏怖」もしくは「共感」？いずれにせよ、なんらかの感情
  - すべての音がProceduralであるLive Codingの可能性の提示
  - DanceableなLive Codingの可能性の提示
- GLSL Musicの楽しさの共有
  - GLSLのコードを組み合わせて音楽を作り上げていく楽しさ・あるいはその可能性
- クラブシーンへの敬意
  - テクノという身体的な音楽の気持ち良さ
  - 音楽に呼応して投影される無機質なVJ表現の「Sync」感
- Demosceneに対しての敬意
  - とりわけ、64k Scene。プロシージャルに映像と音楽を生成することの楽しさ
- 事前計算含めて8分という時間枠を最大限使って観衆を踊らせること

正直、作品を通じて伝えるべきことがだいぶ多すぎてとっ散らかった、かなり自分よがりな作品であるという自覚はある。
これでいい。僕がやりたかったことはやった。

## Demoscene

Demoscene。
コンピュータを用いた創作活動の手段が飽和した現代において、未だに古くから良しとされた美的感覚を重んじる、伝統芸能。

やはりDemosceneのコミュニティには本当に感謝している。
自分のアートに対する平衡感覚・価値観を正常に保ち続けてくれているのは、シーンで活動する人々の存在があってのことだと思う。
最新の技術や手法を取り入れつつ・時には批判的に立ち向かいつつ、自分の感覚・信念に基づいた創作活動を続けられる場がある状態は、本当に貴重なことだと思う。

あえて言うと、日本でDemosceneがアクティブでないのは残念ではある。
幸い、友人とデモパーティーを開催できるほどのリソースは存在するが、コンスタントに作り手とのコミュニケーションができない状態であるのは結構寂しい。

たぶん、全部英語とタイムゾーンが悪い。
全人類日本語喋ってくれ。全人類UTC+9で生活してくれ。

## KPT

→ [KPT](./kpt.md)