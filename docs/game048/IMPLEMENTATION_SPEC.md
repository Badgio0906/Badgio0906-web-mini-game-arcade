# Game048 起動UI・調整コース

未公開候補「ぶら下がれ！ネオン急便」。1指またはSpaceのpressで掴み、保持して振り、正規releaseで飛ぶ。開始ボタンのreleaseは入力へ持ち越さない。最初はフック①に接続済み。次フックの中心から140〜300のannulusだけが取得可能、発射後0.2秒は再取得不可。近すぎる内円も不可。失敗したpressを予約して後で自動取得しない。

元model.tsはbyte保持。別courseModel.tsはroot承認による新候補の配置調整。core-route-1793375833379.jsonのhooksを採用し、元のoriginalと区別する。yは400基準で間隔を.85倍（220→187）、xは元探索の±15%以内の補正。最終hook y2160→1896。既存hooksへのimport時mutationは一切ない。型/physics関数本体は元sourceとbyte一致をunitで検査。重力480/加速150/speed cap850/release加算80/横壁反射−.25/ロープ140〜300/cooldown.2/240Hzを変更しない。

UIの終端は既存成功原本のgoal中心240,2400/半径58と、探索の落下境界y<−100を引継ぐ。全9接続後のgoal到達で配達成功。時間制限の正本は現回収物にないため、起動候補では経過時計のみ・制限なしと明示。点数は最高到達y−180の整数、配達成功＋1000。失敗も真の最高高度分だけ正式BESTへ、途中退出と練習は対象外。練習は次フック1個を新たに掴めば成功。これらUI規則は明記した新規wrapperであり、旧modelに存在した規則と装わない。

cameraはup-positive世界をscreen-downへ変換し、本人を下部寄りに追従。次hookと140/300の輪、現在の距離/取得可能色、接続番号/goalを表示。boardは装飾で当たり判定を作らない。courier/parcel/hook/boardを./assets/name.webpから全decode必須、失敗時は通常開始block。root提供4画像の存在と採否/実表示確認は別。

cancel/lostcapture/blur/hidden/幅変更/回転/pagehide/0.5秒超停止はpause。rope状態を変更せず、勝手なreleaseなし。再開後はfresh press→release。単一primary pointerをcanvas/下部ボタンで共有、2本目は所有不可。key repeat/古いkeyup/開始gestureを採用しない。消費済みpointerのcompatibility clickはmenuへ通さず、新press/keyboardは利用可能。title/help/practice/run/pause/result/retry/一覧../../。

保存key100gare:game048:adjusted-hooks:rules1、旧コースと別。rulesVersion1/best整数0〜10000/有限volume0〜1/muted/light booleanをstrict検査、破損/拒否はmemory-only/永続書込拒否/明示表示。GAPSの048元exportは未提供、権利明確な固有compound WebAudioのみ。24source上限、mute/0/pause/離脱cleanup。

qa buildだけread-only window.__GAME__ getter。state/phase/camera/reach/owner/ready/art/best、直近30秒のframe samplesとp95、audio state/context作成数/sources/peakを返す。setter/時刻変更/自動操縦なし。source timingsはupdate+drawの観測窓であり、短いrunを30秒実測と呼ばない。
