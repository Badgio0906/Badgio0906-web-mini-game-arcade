# SNS流入のUTM命名

`utm_source`は`instagram / tiktok / x / youtube / direct / other`。`utm_medium`は`organic_social / paid_social / referral / other`を基本とする。自分のSNS投稿なら通常`organic_social`、広告なら`paid_social`。直接アクセスにUTMは不要で、集計側で`direct`として扱う。

`utm_campaign`は企画を識別する。例：`portal_launch`、`game018_launch`、`game019_clip`。`utm_content`は投稿・動画を識別する。例：`shoe_just_01`、`frog_fall_02`、`fallking_short_01`。各値は英小文字・数字・snake_case、100文字以下にする。姓名、メールアドレス、ユーザー名、広告対象者ID等の個人情報を含めない。

例：

```text
https://game100garage.com/game018.html?utm_source=x&utm_medium=organic_social&utm_campaign=game018_launch&utm_content=shoe_just_01
https://game100garage.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=portal_launch&utm_content=profile_link
```

同じ企画でも投稿ごとに`utm_content`を変える。プロフィール共通リンクのクリックから個々の投稿を推定しない。共通リンクには`profile_link`など共通の値を使う。GA4と独自Telemetryは同意した観測対象だけを計測するため、SNS管理画面の表示回数やクリック数と一致するとは限らない。

任意のクエリ全文、URL全文、referrer全文は保存しない。許可した流入分類とUTMだけを記録する。作成したリンクを実際に開き、同意後のRealtime/管理画面で流入を確認する。
