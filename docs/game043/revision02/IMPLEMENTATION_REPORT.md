# Game043 改訂報告 — モバイルQA未完
製品90946be7。単体はモデル/リプレイ/メダル/上限の計9、tsc/build成功。固定入力モデルHP3/88graze/7FEVER/6medals、最大43。30/60/120Hz表示からの同じ240Hz入力列は一致。
QA/browser-1793414862333: PC通常キー60秒/HP3/87graze/7FEVER/6medals/48675点/p95.6ms PASS。続く390タッチはdeadでFAIL。最初の失敗は最終snapshot取得不足、内部時刻不明を推測しない。
同じ製品のテストcontrollerだけ限定変更: browser-1793415030647はtouch更新10ms/安全距離27で生存したが3FEVER（4目標未達）、HP2/39graze/1hit、FAIL。最後のbrowser-1793415168367は安全距離25で57.70秒/HP0/54graze/4FEVER、FAIL。2回の限定修正後に同じ長時間試験を止めた。いずれも例外/404/外部0。入力状態の書換えはしていない。
このためモバイルの自動S到達は未実証。PCとモデルに成立経路はあるが、タッチ遅延/操作余裕/本当の難度のどれが主因かUNKNOWN。条件を下げてPASSにしない。生存A実績を全体成功と混同しない。

限定UI/practiceのみ QA/browser-1793415613175 PASS（4幅）。Production QA/production-1793415630223 PASS（4幅）。これらは長時間タッチSの合格ではない。
