

Google Analytics API のクイックスタート

bookmark_border
このクイックスタートでは、Data API または Admin API を使用できます。


API を選択します。 Data API Admin API
認証には、ユーザー アカウントまたはサービス アカウントを使用できます。

アカウントの種類を選択します。 ユーザー アカウント サービス アカウント
このクイックスタートでは、list リクエストを作成して送信します。

手順の概要は次のとおりです。

ツールとアクセスを設定する。
API を有効にします。
SDK をインストールします。
API 呼び出しを行います。
始める前に
gcloud CLI をインストールして初期化します。

アプリケーションのデフォルト認証情報を生成し、アカウントに必要なスコープを付与するには、次のコマンドを実行します。


gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
Google アナリティクスの管理画面で、ユーザー アカウントに Google アナリティクスのプロパティへのアクセス権を付与します。

Admin API を有効にする
Google Cloud プロジェクトを選択または作成して API を有効にするには、[Google Analytics Admin API を有効にする] をクリックします。

Google Analytics Admin API を有効にする
SDK をインストールする
プログラミング言語の SDK をインストールします。

Java
PHP
Python
Node.js
.NET
Ruby
Go
REST
Java クライアント ライブラリのインストール ガイド

API 呼び出しを行う
設定を確認して API 呼び出しを行うには、次のサンプルを実行します。

このサンプルでは、list メソッドを呼び出します。レスポンスには、ユーザーの アカウントがアクセスできる Google アナリティクス アカウントが一覧表示されます。

Analytics API のすべてのコードサンプルをインストールするには、GitHub をご覧ください。

Java
PHP
Python
Node.js
.NET
REST

google-analytics-admin/src/main/java/com/google/analytics/admin/samples/QuickstartSample.javaCloud Shell で開く GitHub で表示

import com.google.analytics.admin.v1beta.Account;
import com.google.analytics.admin.v1beta.AnalyticsAdminServiceClient;
import com.google.analytics.admin.v1beta.AnalyticsAdminServiceClient.ListAccountsPage;
import com.google.analytics.admin.v1beta.AnalyticsAdminServiceClient.ListAccountsPagedResponse;
import com.google.analytics.admin.v1beta.ListAccountsRequest;

/**
 * This application demonstrates the usage of the Analytics Admin API using service account
 * credentials. For more information on service accounts, see
 * https://cloud.google.com/iam/docs/understanding-service-accounts.
 *
 * <p>The following document provides instructions on setting service account credentials for your
 * application: https://cloud.google.com/docs/authentication/production
 *
 * <p>In a nutshell, you need to:
 *
 * <ol>
 *   <li>Create a service account and download the key JSON file as described at
 *       https://cloud.google.com/docs/authentication/production#creating_a_service_account.
 *   <li>Provide service account credentials using one of the following options:
 *       <ul>
 *         <li>Set the {@code GOOGLE_APPLICATION_CREDENTIALS} environment variable. The API client
 *             will use the value of this variable to find the service account key JSON file. See
 *             https://cloud.google.com/docs/authentication/production#setting_the_environment_variable
 *             for more information.
 *             <p>OR
 *         <li>Manually pass the path to the service account key JSON file to the API client by
 *             specifying the {@code keyFilename} parameter in the constructor. See
 *             https://cloud.google.com/docs/authentication/production#passing_the_path_to_the_service_account_key_in_code
 *             for more information.
 *       </ul>
 * </ol>
 *
 * <p>To run this sample using Maven:
 *
 * <pre>{@code
 * cd google-analytics-data
 * mvn compile exec:java -Dexec.mainClass="com.google.analytics.admin.samples.QuickstartSample"
 * }</pre>
 */
public class QuickstartSample {

  public static void main(String... args) throws Exception {
    listAccounts();
  }

  // This is an example snippet that calls the Google Analytics Admin API and lists all Google
  // Analytics accounts available to the authenticated user.
  static void listAccounts() throws Exception {
    // Instantiates a client using default credentials.
    // See https://cloud.google.com/docs/authentication/production for more information
    // about managing credentials.
    try (AnalyticsAdminServiceClient analyticsAdmin = AnalyticsAdminServiceClient.create()) {
      // Calls listAccounts() method of the Google Analytics Admin API and prints
      // the response for each account.
      ListAccountsPagedResponse response =
          analyticsAdmin.listAccounts(ListAccountsRequest.newBuilder().build());
      for (ListAccountsPage page : response.iteratePages()) {
        for (Account account : page.iterateAll()) {
          System.out.printf("Account name: %s%n", account.getName());
          System.out.printf("Display name: %s%n", account.getDisplayName());
          System.out.printf("Country code: %s%n", account.getRegionCode());
          System.out.printf("Create time: %s%n", account.getCreateTime().getSeconds());
          System.out.printf("Update time: %s%n", account.getUpdateTime().getSeconds());
          System.out.println();
        }
      }
    }
  }
}
JSON 形式のレスポンスの例を次に示します。


{
  "accounts": [
    {
      "name": "accounts/123456789",
      "createTime": "2025-01-01T00:12:23.456Z",
      "createTime": "2025-01-01T00:12:23.456Z",
      "displayName": "Demo Account",
      "regionCode": "US",
      "gmpOrganization": "marketingplatformadmin.googleapis.com/organizations/abcdef12345678"
    }
}

Google Analytics API のクイックスタート

bookmark_border
このクイックスタートでは、Data API または Admin API を使用できます。


API を選択します。 Data API Admin API
認証には、ユーザー アカウントまたはサービス アカウントを使用できます。

アカウントの種類を選択します。 ユーザー アカウント サービス アカウント
このクイックスタートでは、runReport リクエストを作成して送信します。

手順の概要は次のとおりです。

ツールとアクセスを設定する。
API を有効にします。
SDK をインストールします。
API 呼び出しを行います。
始める前に
gcloud CLI をインストールして初期化します。

アプリケーションのデフォルト認証情報を生成し、アカウントに必要なスコープを付与するには、次のコマンドを実行します。


gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
Google アナリティクスの管理画面で、ユーザー アカウントに Google アナリティクスのプロパティへのアクセス権を付与します。

Data API を有効にする
Google Cloud プロジェクトを選択または作成して API を有効にするには、[Google アナリティクス Data API v1 を有効にする] をクリックします。

Google アナリティクス Data API v1 を有効にする
SDK をインストールする
プログラミング言語の SDK をインストールします。

Java
PHP
Python
Node.js
.NET
Ruby
Go
REST
Java クライアント ライブラリのインストール ガイド

API 呼び出しを行う
設定を確認して API 呼び出しを行うには、次のサンプルを実行します。

このサンプルでは、runReport メソッドを呼び出します。レスポンスには、プロパティのアクティブ ユーザーが一覧表示されます。

Analytics API のすべてのコードサンプルをインストールするには、GitHub をご覧ください。

Java
PHP
Python
Node.js
.NET
REST

google-analytics-data/src/main/java/com/google/analytics/data/samples/QuickstartSample.javaCloud Shell で開く GitHub で表示

import com.google.analytics.data.v1beta.BetaAnalyticsDataClient;
import com.google.analytics.data.v1beta.DateRange;
import com.google.analytics.data.v1beta.Dimension;
import com.google.analytics.data.v1beta.Metric;
import com.google.analytics.data.v1beta.Row;
import com.google.analytics.data.v1beta.RunReportRequest;
import com.google.analytics.data.v1beta.RunReportResponse;

/**
 * Google Analytics Data API sample quickstart application.
 *
 * <p>This application demonstrates the usage of the Analytics Data API using service account
 * credentials.
 *
 * <p>Before you start the application, please review the comments starting with "TODO(developer)"
 * and update the code to use correct values.
 *
 * <p>To run this sample using Maven:
 *
 * <pre>{@code
 * cd google-analytics-data
 * mvn compile exec:java -Dexec.mainClass="com.google.analytics.data.samples.QuickstartSample"
 * }</pre>
 */
public class QuickstartSample {

  public static void main(String... args) throws Exception {
    /**
     * TODO(developer): Replace this variable with your Google Analytics 4 property ID before
     * running the sample.
     */
    String propertyId = "YOUR-GA4-PROPERTY-ID";
    sampleRunReport(propertyId);
  }

  // This is an example snippet that calls the Google Analytics Data API and runs a simple report
  // on the provided GA4 property id.
  static void sampleRunReport(String propertyId) throws Exception {
    // Using a default constructor instructs the client to use the credentials
    // specified in GOOGLE_APPLICATION_CREDENTIALS environment variable.
    try (BetaAnalyticsDataClient analyticsData = BetaAnalyticsDataClient.create()) {

      RunReportRequest request =
          RunReportRequest.newBuilder()
              .setProperty("properties/" + propertyId)
              .addDimensions(Dimension.newBuilder().setName("city"))
              .addMetrics(Metric.newBuilder().setName("activeUsers"))
              .addDateRanges(DateRange.newBuilder().setStartDate("2020-03-31").setEndDate("today"))
              .build();

      // Make the request.
      RunReportResponse response = analyticsData.runReport(request);

      System.out.println("Report result:");
      // Iterate through every row of the API response.
      for (Row row : response.getRowsList()) {
        System.out.printf(
            "%s, %s%n", row.getDimensionValues(0).getValue(), row.getMetricValues(0).getValue());
      }
    }
  }
}
JSON 形式のレスポンスの例を次に示します。


{
  "dimensionHeaders": [
    {
      "name": "country"
    }
  ],
  "metricHeaders": [
    {
      "name": "activeUsers",
      "type": "TYPE_INTEGER"
    }
  ],
  "rows": [
    {
      "dimensionValues": [
        {
          "value": "United States"
        }
      ],
      "metricValues": [
        {
          "value": "3242"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "(not set)"
        }
      ],
      "metricValues": [
        {
          "value": "3015"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "India"
        }
      ],
      "metricValues": [
        {
          "value": "805"
        }
      ]
    }
  ],
  "rowCount": 3,
  "metadata": {
    "currencyCode": "USD",
    "timeZone": "America/Los_Angeles"
  },
  "kind": "analyticsData#runReport"
}

Google タグとタグ マネージャー

bookmark_border
このドキュメントは、タグを初めて設定する方や、タグの最適なセットアップ方法を知りたい方を対象としています。

このドキュメントでは、Google タグ（gtag.js）とタグ マネージャーの概要を説明します。 アプリで Google アナリティクスを導入する場合は、Firebase のドキュメントもご覧ください。

概要
Google タグは、それをひとつウェブサイトに追加するだけで、ウェブサイトと広告のパフォーマンスを測定できるタグです。Google タグは、Google 広告と Google アナリティクス 4（GA4）（リンク先とも呼ばれます）にデータを送信するのに必要です。

注: Google タグからデータを受け取るには、データ受け取り先の Google サービスの利用規約に同意する必要があります。
自分に最適なタグ設定オプション
Google タグは、そのまま使用することも、タグ マネージャーで使用することもできます。

この記事では、ご自身のニーズに合わせて適切なオプションを選択できるよう、さまざまなタグ設定オプションについて説明します。

Google タグのみを使用するケース
Google タグは、あらゆるユースケースにおける測定の基礎となります。現在 Google 広告または GA4 を使用している場合は、Google タグが自動生成されます。次のステップは、ウェブサイトのコードを更新することです。

Google タグを使用すると、次のことができます。

Google の各サービスのアカウントごとにタグを管理するのではなく、ウェブサイト全体で単一の Google タグを使用できます。
ページビュー数、クリック数、スクロール数などを、Google アナリティクスで自動的に測定できます。詳細
コンバージョンやキャンペーンのパフォーマンスを、Google 広告で自動的に測定できます。 詳細
Google タグの設定を Google の各サービス（例: Google 広告、Google アナリティクス、Google タグ マネージャー）内から調整できるため、サイトのコード編集は最小限で済みます。
このタグ設定オプションは、ウェブ開発チームをすぐに利用できない場合や、コンテンツ マネジメント システム（CMS）を使用しているマーケティング担当者に最適です。ページビュー数、クリック数、スクロール数など、デフォルトの指標のみが必要な場合は、Google タグを 1 回セットアップすれば準備完了です。

準備ができたら
ウェブサイト作成ツールまたは CMS で Google タグを設置する

ウェブサイト作成ツールまたは CMS を使用しない場合: Google タグをセットアップする

より細かい管理が必要な場合
次のタグ設定オプションのいずれかを Google タグに追加することを検討してください。

Google タグ マネージャー（推奨）
gtag.js
gtag.js とは
Google タグは、gtag.js JavaScript フレームワークを使用して、Google タグをウェブページに直接追加します。効果的に gtag.js を使用するには、HTML、CSS、JavaScript に精通している必要があります。

このタグ設定オプションは、Google タグの管理のみが必要な、タグ設定を担当するウェブ デベロッパーに最適です。gtag.js を使用するとウェブページに直接タグを実装できるため、タグ管理システムのセットアップに必要な立ち上げ時間がいりません。

注: Google タグと gtag.js は、Google サービスにのみデータを送信できます。
タグ設定をさらに高度にする必要が生じたら、いつでも Google タグ マネージャーにタグを移行することができます。

Google タグ マネージャーとは
タグ マネージャーは、ウェブ インターフェースから、ウェブサイトまたはモバイルアプリ上のタグをすばやく簡単に更新できるタグ管理システムです。Google タグ マネージャーを使用して、ウェブサイトに Google タグを読み込むことができます。この方法は、Google タグ コード スニペットをサイトに追加するのと同じ結果を得られます。

タグ マネージャーでは、Google 固有のタグ、さまざまな第三者タグだけでなくカスタムタグさえサポートされています。詳しくは、サポートされているすべてのタグをご確認ください。

このオプションは、タグ設定を担当し、Google と第三者からのタグを管理する必要があるマーケティング担当者に最適です。タグ管理者と代理店にも適しており、サイトコードの変更と組み合わせて使用できます。

Google タグ マネージャーと gtag.js の比較
次の表は、タグ マネージャーと gtag.js の違いを示しています。

gtag.js（コードのデプロイ）

Google タグ マネージャー（タグ管理システム）

タグをデプロイしてウェブ コレクションをカスタマイズするコードを記述する必要があります

コードを編集せずに、Google と第三者のタグの両方を簡単にデプロイして変更できます。
サポートされているすべてのタグを見る

Google サービスのデータのみを送信できます。

Google タグ、サードパーティ タグ、カスタムタグのデータを送信できます。

タグはコード内から管理する必要があり、さまざまなアウトレット（ウェブやアプリ）でコードを複製する必要があるかもしれません。

ウェブサイトとアプリのタグをすべて tagmanager.google.com から管理します

バージョン管理は、コードをどのように管理するかによって決まります。

ワークスペースとバージョン管理のタグを使用して、他のユーザーと共同作業を行えます。

サーバーサイド タグ設定に対応しています。サーバー コンテナのデプロイと操作には、Google タグ マネージャーを使用する必要があります。

タグ マネージャーを使用すると、サーバーにタグを簡単にデプロイできます。 このオプションをご検討の場合は、クライアントサイドとサーバーサイドのタグ設定をご覧ください。

静的サイト生成ツール、CMS、ウェブサイト作成ツール、または JavaScript をサポートする手動で作成された HTML ページと互換性があります。

多くの CMS およびウェブサイト作成ツールに対応しています。システムがタグ マネージャーに対応していない場合は、代わりに Google タグ（gtag.js）を使用してください。

費用: 無料

費用: 無料

Google タグ マネージャーを使用する準備はできましたか？
タグ マネージャーのセットアップとインストール →

すでにタグ マネージャーを使用している場合は、引き続きタグ マネージャーを使用してください。タグ マネージャーは Google 広告タグと Google マーケティング プラットフォーム タグを完全にサポートしているため、タグ マネージャーをすでに使用している場合は、gtag.js を使用してサイトに追加のコードを実装する必要はありません。

Google アナリティクス: GA4 設定タグが Google タグになりました
GA4 設定タグを使用していた場合、自動的に Google タグにアップグレードされます。測定と機能は以前と同様に機能するため、必要なご対応は特にありません。
GA4 イベントタグは変更されません。

次のステップ
Google タグ（gtag.js）をインストールする
タグ マネージャーで Google アナリティクス 4 をセットアップする
Google タグ マネージャーでタグをセットアップする

イベントをセットアップする

bookmark_border
イベントを設定すると、ウェブサイトやアプリで発生したユーザーの操作（ページの読み込み、リンクのクリック、購入など）を測定して、ビジネスのレポートに反映できるようになります。詳細

このガイドでは、Google タグ（gtag.js）または Google タグ マネージャーを使って推奨イベントとカスタム イベントをウェブサイトに設定する方法について説明します。自動収集イベントと拡張計測機能イベントを設定する必要はありません。

対象者
このガイドは、Google アナリティクスを設定して、データをレポートに出力できるようになったユーザーのうち、アナリティクスの自動収集ではカバーしきれないデータを収集する必要がある方、または特定の機能をアナリティクスで使用する必要がある方を対象としています。


Google タグ タグ マネージャー

始める前に
このガイドは、以下を完了されていることを前提とした内容です。

Google アナリティクス 4 のアカウントとプロパティの作成
ウェブサイト用のウェブデータ ストリームの作成
ウェブサイトへの Google タグ設置
また、次のものをお持ちであることを前提としています。

ウェブサイトのソースコードへのアクセス権
Google アナリティクス アカウントの編集者の役割
イベントをセットアップする
gtag.js API を使って、Google アナリティクスにイベントを送信します。この API には gtag() という関数があります。Google アナリティクスにイベントを送信する際は、次の構文を使用します。


gtag('event', '<event_name>', {
  <event_parameters>
});
この例の gtag() 関数には以下が含まれています。

イベントの送信であることを Google に伝える event コマンド
推奨イベントまたはカスタム イベントの名前
（任意）イベントについての追加情報を提供するパラメータ群
たとえば、screen_view という推奨イベントに 2 つのパラメータを追加して送信する場合は、次のようになります。


gtag('event', 'screen_view', {
  'app_name': 'myAppName',
  'screen_name': 'Home'
});
JavaScript にイベントを追加する
gtag() は JavaScript 関数なので、ウェブページの JavaScript コードに追加する必要があります。<script> タグ内や、HTML ページにインポートする別の JavaScript ファイルに追加することができます。

JavaScript にイベントを追加する位置は、Google タグスニペットよりも下（後）であれば、どこでもかまいません。Google タグスニペットよりも上（前）に設置すると、そのイベントのデータは処理されませんのでご注意ください。たとえば、下記のサンプルコードの場合、<script> タグ内に screen_view というイベントが含まれています。


<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-XXXXXXXXXX');
    </script>

    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title of the page</title>
</head>
<body>
    <p>Welcome to my website!</p>
    
    <script>
      /**
      * The following event is sent when the page loads. You could
      * wrap the event in a JavaScript function so the event is
      * sent when the user performs some action.
      */
      gtag('event', 'screen_view', {
        'app_name': 'myAppName',
        'screen_name': 'Home'
      });
    </script> 
</body>
</html>
ボタンのクリック（または他のユーザー行動）に基づいてイベントを送信する場合は、JavaScript をイベントに追加します。

アナリティクスでイベントを確認する
イベントとそのパラメータは、リアルタイム レポートと DebugView レポートで確認できます。DebugView レポートを使用するには、追加の設定がいくつか必要となる点に注意しましょう。これらのレポートでは、ウェブサイトでユーザーがトリガーしたイベントが、発生と同時に表示されます。

イベント パラメータをセットアップする

bookmark_border
このガイドでは、ウェブサイトで発生したイベントについてさらに詳しい情報を収集できるよう、推奨イベントおよびカスタム イベントのパラメータをセットアップする方法を解説します。アイテム スコープのパラメータを追加する方法は、e コマースを測定するでご確認ください。

対象者
すでにセットアップしたイベントを通して、ユーザー行動についてさらに詳しい情報を収集したいと考えている方。

ウェブサイトで Google タグ（gtag.js）または Google タグ マネージャーを使用している方。モバイルアプリのイベント パラメータをセットアップしたい場合は、イベントをロギングするをご覧ください。


Google タグ タグ マネージャー

始める前に
このガイドは、以下を完了されていることを前提とした内容です。

Google アナリティクス 4 のアカウントとプロパティの作成
ウェブサイト用のウェブデータ ストリームの作成
ウェブサイトへの Google タグスニペットの設置
また、次のものをお持ちであることを前提としています。

ウェブサイトのソースコードへのアクセス権
Google アナリティクス アカウントの「編集者」（またはそれ以上の）役割
このガイドの前に、イベントをセットアップするもお読みください。

イベント パラメータとは
パラメータは、ウェブサイトに対するユーザーのアクションについて、さらに詳しい情報を提供する仕組みです。たとえば販売している商品をユーザーが閲覧した際に、閲覧された商品の具体的な情報（商品名、カテゴリ、価格など）を、パラメータとして送信することができます。

自動収集イベントと拡張計測機能イベントには、デフォルトでパラメータが含まれています。各推奨イベントについても、必須または任意のパラメータ群がそれぞれ用意されています。また、必要に応じてイベント パラメータをさらに追加することも可能です。

イベント パラメータをセットアップする
イベントの構造は次のとおりです。イベント パラメータは、<event_parameters> とある箇所に Key-Value ペアの形式で記述されます。


gtag('event', '<event_name>', {
  <event_parameters>
});
たとえば次のようになります。


gtag('event', 'screen_view', {
  'app_name': 'myAppName',
  'screen_name': 'Home'
});
このコード例に含まれる要素:

イベント パラメータの名前: app_name、screen_name
イベント パラメータの値: myAppName、Home
全イベント共通のパラメータをセットアップする
前セクションの例では、gtag() 関数で event コマンドを使って、単一のイベントのパラメータを指定しています。ページ内の全イベントで送信したいパラメータがある場合は、Google タグスニペット（HTML コードの <head> タグ内に設置）の config コマンドを編集する方法もあります。

次のコードでは、ページ内のすべてのイベントとともに送信するパラメータとして、ページのタイトルなどを指定しています。


<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-XXXXXXXXXX', {
  'page_title': 'Travel Destinations',
  'currency': 'USD'
});
</script>
同じページにタグ ID を複数追加する場合は、config コマンドを編集する代わりに set コマンドを追加すれば、設定したパラメータをすべての ID に継承させることができます。set コマンドは、config コマンドよりも上（前）に配置してください。


gtag('set', {
  'page_title': 'Travel Destinations',
  'currency': 'USD'
});
// Place your config commands after the set command like follows
gtag('config', 'G-XXXXXXXXXX-1');
gtag('config', 'G-XXXXXXXXXX-2');
gtag('config', 'G-XXXXXXXXXX-3');
アナリティクスでイベントを確認する
イベントとそのパラメータは、リアルタイム レポートと DebugView レポートで確認できます。DebugView レポートを使用するには、追加の設定がいくつか必要となる点に注意しましょう。これらのレポートでは、ウェブサイトでユーザーがトリガーしたイベントが、発生と同時に表示されます。

一部のパラメータは、Google アナリティクスで事前構築済みのディメンションと指標に自動的に入力されます。たとえば、自動収集イベントと拡張計測機能イベントのパラメータ、および推奨イベントとともに送信する必須パラメータと省略可能なパラメータは、事前構築済みのディメンションと指標に入力されます。

その他のパラメータについては、Google アナリティクスでパラメータ値を確認するにはカスタム ディメンションとカスタム指標を作成する必要があります。カスタム パラメータを作成する際は、そのデータを確認できるように、対応するカスタム ディメンションまたはカスタム指標を必ず作成しましょう。

ページビューの測定

bookmark_border
ユーザーがサイトのページを読み込むか、そのアクティブなサイトによってユーザーの閲覧履歴のステータスが変更されると、そのたびに拡張計測機能のイベント「page_view」がサイトから Google アナリティクスに送られます。このイベントは自動的に送信されるため、ページビュー データをアナリティクスに手動で送る必要はありません。

ただし、ページビューの送信方法を手動で制御したい場合は（シングルページ アプリケーションの場合や無限スクロールを使用している場合など）、ページビューの自動送信を無効化して、ページビューをサイトから手動で送ることも可能です。シングルページ アプリケーションを測定する方法を学習する。

このドキュメントでは、ページビューのデフォルトの処理方法を説明したうえで、ページビューを手動で送信する方法を説明します。

モバイルアプリのスクリーンビューを測定する方法については、この記事ではなくスクリーンビューを測定するをご覧ください。


gtag.js タグ マネージャー

始める前に
このガイドは、以下を完了されていることを前提とした内容です。

Google アナリティクスのアカウントとプロパティを作成します。この手順を行うと、Google タグが自動的に作成されます。
ウェブサイト用のウェブデータ ストリームの作成
ウェブサイトへの Google タグスニペットの設置
また、次のものをお持ちであることを前提としています。

ウェブサイトのソースコードへのアクセス権
Google アナリティクス アカウントの「編集者」（またはそれ以上の）ロール
デフォルトの動作
Google タグ（gtag.js）をサイトに追加する際、タグのコード スニペットには、デフォルトでページビューを送信する config コマンドが含まれています。ページビューについての情報を含む追加の <parameters> を組み込めば、Google アナリティクスの初期化方法を指定することが可能です。


gtag('config', 'TAG_ID', <parameters>);
ページビューの動作は、次のキーを使ってカスタマイズできます。

名前	タイプ	必須	デフォルト値	説明
page_title	string	×	document.title	ページのタイトル。
page_location	string	×	location.href	
ページの URL。

page_location をオーバーライドする場合、値は、先頭にプロトコルを付けた完全な URL（例: https://www.example.com/contact-us-submitted）にする必要があります。

注: デフォルト値では、URL のフラグメントは除外されます。
send_page_view	boolean	×	true	ページビューを送信するかどうかを指定。
たとえば page_title の値をオーバーライドする場合は、次のようになります。


gtag('config', 'TAG_ID', {
  'page_title' : 'homepage'
});
手動のページビュー
ページビューの送信方法を手動で制御したい場合（シングルページ アプリケーションの場合や無限スクロールを使用している場合など）は、以下を行います。

ページビュー測定を無効化する
適切なタイミングで page_view イベントを送信する
注意: ページビュー測定を無効化せずに手動でページビューを送信すると、ページビューが二重に記録されるおそれがあります。
ページビュー測定を無効化する
デフォルトの page_view イベントを無効化するには、Google タグ スニペット内で send_page_view パラメータを false に設定します。


gtag('config', 'TAG_ID', {
  send_page_view: false
});
send_page_view の設定は、ページをまたいで保持されません。ウェブサイト内の、ページビューの自動処理を無効化したいすべてのページで、この設定を繰り返す必要があります。

page_view イベントを手動で送信する
適切なタイミングで、次のように gtag 呼び出しを行います。プレースホルダ値は実際の値に置き換えてください。


gtag('event', 'page_view', {
  page_title: '<Page Title>',
  page_location: '<Page Location>'
});

Google Analytics Admin API の概要

bookmark_border
概要: このドキュメントでは、Google アナリティクス Admin API バージョン 1.0 の概要について説明します。

この API は、アルファ版とベータ版のチャンネルで機能を提供します。アルファ版とベータ版のプロダクトについてはサポートが制限され、これらのプロダクトの変更は、他のアルファ版とベータ版のバージョンと互換性がない可能性があります。

アルファ版: 機能は早期プレビュー段階です。今後の変更については随時お知らせしますが、API が一般公開される前に新しい変更内容が導入されることが予想されます。

ベータ版: このチャンネルでは互換性に関する変更は予定されていません。

Google Analytics API の公式なお知らせを受け取るには、Google Analytics API Notify Group にご登録ください。

はじめに
Google アナリティクスの Admin API を使用すると、Google アナリティクスの設定データにプログラムでアクセスできます。この API は、Google アナリティクスのプロパティとのみ互換性があります。詳しくは、Google アナリティクスのプロパティについての記事をご覧ください。

Google Analytics Admin API を使用すると、次のことができます。

新しいアカウントをプロビジョニングする。
アカウントを管理する。
データ共有設定を管理する。
アカウントの概要を一覧表示します。
変更履歴イベントを検索する。
プロパティを管理する。
サブプロパティを管理する。
ユーザーデータの収集に同意します。
プロパティのデータ保持設定を管理する。
Google シグナルにおける特定のプロパティの設定を管理する（アルファ版）
ストリームを管理する。
Measurement Protocol のシークレットを管理する。
SKAdNetwork コンバージョン値スキーマを管理する（アルファ版）。
ウェブデータ ストリーム用の Google タグスニペットを生成する（アルファ版）。
キーイベントを管理する。
コンバージョン イベントを管理する（非推奨）
イベント作成ルールを管理する（アルファ版）
イベントの編集ルールを管理する（アルファ版）
カスタム ディメンションを管理する。
カスタム指標を管理する。
Google アナリティクスのプロパティと Firebase プロジェクト間のリンクを管理する。
Google アナリティクスのプロパティと Google 広告アカウントのリンクを管理する。
Google アナリティクスのプロパティとディスプレイ＆ビデオ 360 の広告主とのリンクの提案を管理する（アルファ版）。
Google アナリティクスのプロパティとディスプレイ＆ビデオ 360 の広告主とのリンクを管理する（アルファ版）。
Google アナリティクスのプロパティと検索広告 360 のリンクを管理する（アルファ版）
Google アナリティクスのプロパティと BigQuery プロジェクト間のリンクを管理する（アルファ版）。
アカウント階層と Google アナリティクスのプロパティのユーザー権限を管理する（アルファ版）。
データアクセス レポートを生成する。
オーディエンスの管理（アルファ版）
拡張データセットを管理する（アルファ版）。
Google アナリティクスの自動設定プロセスのオプトアウト設定を管理（アルファ版）。
利用可能な方法
使用可能な方法は次のとおりです。

アカウント プロビジョニング
accounts.provisionAccountTicket
このメソッドは、利用規約（TOS）の URL に含める必要がある accountTicketId フィールドを返します。

https://analytics.google.com/analytics/web/?provisioningSignup=false#/termsofservice/ACCOUNT_TICKET_ID

ユーザーが利用規約の URL にアクセスして利用規約に同意すると、Google アナリティクス アカウントの作成が完了します。アカウントのプロビジョニング サンプルをご覧ください。

アカウント管理
accounts.delete
accounts.get
accounts.list
accounts.patch
データ共有設定の管理
accounts.getDataSharingSettings
アカウント概要のリスト
accountSummaries.list
変更履歴イベントを検索する
accounts.searchChangeHistoryEvents
プロパティ管理
properties.get
properties.patch
properties.delete
properties.list
properties.create
サブプロパティの管理（アルファ版）
properties.provisionSubproperty
ユーザーデータ収集の確認
properties.acknowledgeUserDataCollection
データ保持設定の管理
properties.getDataRetentionSettings
properties.updateDataRetentionSettings
Google シグナルの設定管理（アルファ版）
properties.getGoogleSignalsSettings
properties.updateGoogleSignalsSettings
データ ストリームの管理
properties.dataStreams.create
properties.dataStreams.get
properties.dataStreams.list
properties.dataStreams.patch
properties.dataStreams.delete
Measurement Protocol のシークレットの管理
properties.dataStreams.measurementProtocolSecrets.create
properties.dataStreams.measurementProtocolSecrets.get
properties.dataStreams.measurementProtocolSecrets.patch
properties.dataStreams.measurementProtocolSecrets.list
properties.dataStreams.measurementProtocolSecrets.delete
SKAdNetwork コンバージョン値スキーマの管理（アルファ版）
properties.dataStreams.sKAdNetworkConversionValueSchema.get
properties.dataStreams.sKAdNetworkConversionValueSchema.create
properties.dataStreams.sKAdNetworkConversionValueSchema.delete
properties.dataStreams.sKAdNetworkConversionValueSchema.update
properties.dataStreams.sKAdNetworkConversionValueSchema.list
キーイベントの管理
properties.keyEvents.create
properties.keyEvents.get
properties.keyEvents.list
properties.keyEvents.delete
properties.keyEvents.patch
コンバージョン イベントの管理
非推奨: 代わりに KeyEvent リソースとメソッドを使用してください。
properties.conversionEvents.create
properties.conversionEvents.get
properties.conversionEvents.list
properties.conversionEvents.delete
properties.conversionEvents.patch
イベント作成ルールの管理（アルファ版）
properties.dataStreams.eventCreateRules.create
properties.dataStreams.eventCreateRules.get
properties.dataStreams.eventCreateRules.list
properties.dataStreams.eventCreateRules.delete
properties.dataStreams.eventCreateRules.patch
イベント編集ルールの管理（アルファ版）
properties.dataStreams.eventEditRules.create
properties.dataStreams.eventEditRules.get
properties.dataStreams.eventEditRules.list
properties.dataStreams.eventEditRules.delete
properties.dataStreams.eventEditRules.patch
properties.dataStreams.eventEditRules.reorder
カスタム ディメンションの管理
properties.customDimensions.create
properties.customDimensions.get
properties.customDimensions.list
properties.customDimensions.patch
properties.customDimensions.archive
カスタム指標の管理
properties.customMetrics.create
properties.customMetrics.get
properties.customMetrics.list
properties.customMetrics.patch
properties.customMetrics.archive
Firebase プロジェクトのリンク
properties.firebaseLinks.create
properties.firebaseLinks.list
properties.firebaseLinks.delete
Google 広告アカウントとのリンク
properties.googleAdsLinks.create
properties.googleAdsLinks.list
properties.googleAdsLinks.patch
properties.googleAdsLinks.delete
Google タグの生成（アルファ版）
properties.webDataStreams.getGlobalSiteTag
Google アナリティクスのプロパティとディスプレイ＆ビデオ 360 の広告主とのリンクの候補（アルファ版）
properties.displayVideo360AdvertiserLinkProposals.create
properties.displayVideo360AdvertiserLinkProposals.approve
properties.displayVideo360AdvertiserLinkProposals.cancel
properties.displayVideo360AdvertiserLinkProposals.list
properties.displayVideo360AdvertiserLinkProposals.get
properties.displayVideo360AdvertiserLinkProposals.delete
ディスプレイ＆ビデオ 360 広告主アカウントのリンク（アルファ版）
properties.displayVideo360AdvertiserLinks.create
properties.displayVideo360AdvertiserLinks.get
properties.displayVideo360AdvertiserLinks.list
properties.displayVideo360AdvertiserLinks.delete
properties.displayVideo360AdvertiserLinks.patch
検索広告 360 アカウントのリンク（アルファ版）
properties.searchAds360Links.create
properties.searchAds360Links.delete
properties.searchAds360Links.patch
properties.searchAds360Links.list
properties.searchAds360Links.get
詳しくは、Google アナリティクスのプロパティでアナリティクスと検索広告 360 の統合を設定する方法をご覧ください。

BigQuery アカウントのリンク（アルファ版）
properties.bigQueryLinks.create
properties.bigQueryLinks.delete
properties.bigQueryLinks.get
properties.bigQueryLinks.list
properties.bigQueryLinks.patch
Google アナリティクス プロパティの BigQuery Export の設定の詳細

ユーザー権限の管理（アルファ版）
accounts.accessBindings.create
accounts.accessBindings.delete
accounts.accessBindings.patch
accounts.accessBindings.list
accounts.accessBindings.get
accounts.accessBindings.batchCreate
accounts.accessBindings.batchDelete
accounts.accessBindings.batchUpdate
accounts.accessBindings.batchGet
properties.accessBindings.create
properties.accessBindings.delete
properties.accessBindings.patch
properties.accessBindings.list
properties.accessBindings.get
properties.accessBindings.batchCreate
properties.accessBindings.batchDelete
properties.accessBindings.batchUpdate
properties.accessBindings.batchGet
データアクセス レポート
properties.runAccessReport
この機能の詳細については、データアクセス レポート ガイドをご覧ください。

オーディエンス管理（アルファ版）
properties.audiences.create
properties.audiences.archive
properties.audiences.patch
properties.audiences.list
properties.audiences.get
詳しくは、Google アナリティクスのオーディエンスについての記事をご覧ください。

拡張データセットの管理（アルファ版）
properties.expandedDataSets.create
properties.expandedDataSets.delete
properties.expandedDataSets.patch
properties.expandedDataSets.list
properties.expandedDataSets.get
Google アナリティクス 360 の拡張データセットの詳細

Google アナリティクスの自動設定プロセスのオプトアウト（アルファ版）
properties.setAutomatedGa4ConfigurationOptOut
properties.fetchAutomatedGa4ConfigurationOptOut
UA プロパティの自動 Google アナリティクス設定プロセスのオプトアウト ステータスの管理について

レポートを作成する

bookmark_border
このガイドでは、Google アナリティクス Data API v1 を使用してアナリティクス データの基本レポートを作成する方法について説明します。Data API v1 のレポートは、Google アナリティクスの管理画面の [レポート] セクションで生成できるレポートに似ています。

このガイドでは、Data API の一般的なレポート機能であるコア レポートについて説明します。Data API v1 には、リアルタイム レポートと目標到達プロセス レポートも用意されています。

runReport はクエリに推奨されるメソッドであり、このガイドのすべての例で使用されます。その他のコア レポート方法の概要については、高度な機能をご覧ください。クエリ エクスプローラを使用してクエリをテストします。

レポートの概要
レポートは、Google アナリティクスのプロパティのイベントデータの表です。各レポートの表には、クエリでリクエストされたディメンションと指標が含まれ、データは個々の行に表示されます。

フィルタを使用して特定の条件に一致する行のみを返します。ページネーションを使用して結果を移動します。

1 つのディメンション（Country）と 1 つの指標（activeUsers）を示すレポート表の例を以下に示します。

国	アクティブ ユーザー
日本	2541
フランス	12
データソースを指定する
runReport リクエストごとに、Google アナリティクスのプロパティ ID を指定する必要があります。指定したアナリティクス プロパティが、そのクエリのデータセットとして使用されます。次の例をご覧ください。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
このリクエストからのレスポンスには、GA_PROPERTY_ID として指定したアナリティクス プロパティのデータのみが含まれます。

Data API クライアント ライブラリを使用する場合は、property パラメータにデータソースを properties/GA_PROPERTY_ID の形式で指定します。クライアント ライブラリの使用例については、クイック スタートガイドをご覧ください。

Measurement Protocol イベントをレポートに含めるには、Measurement Protocol イベントを Google アナリティクスに送信するをご覧ください。

レポートを生成する
レポートを生成するには、RunReportRequest オブジェクトを作成します。最初は次のパラメータを使用することをおすすめします。

dateRanges フィールドの有効なエントリ。
dimensions フィールドに有効なエントリが 1 つ以上ある。
metrics フィールドに有効なエントリが 1 つ以上ある。
推奨されるフィールドを含むリクエストの例を次に示します。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "dateRanges": [{ "startDate": "2023-09-01"", "endDate": "2023-09-15" }],
    "dimensions": [{ "name": "country" }],
    "metrics": [{ "name": "activeUsers" }]
  }
指標をクエリする
Metrics は、イベントデータの定量的な測定値です。runReport リクエストで少なくとも 1 つの指標を指定する必要があります。

クエリ可能な指標の一覧については、API 指標をご覧ください。

ディメンション date でグループ化された 3 つの指標を示すサンプル リクエストを次に示します。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
    "dimensions": [{ "name": "date" }],
    "metrics": [
      {
        "name": "activeUsers"
      },
      {
        "name": "newUsers"
      },
      {
        "name": "totalRevenue"
      }
    ],
  }
次のサンプル レスポンスでは、20231025 日（2023 年 10 月 25 日）のアナリティクス プロパティの通貨で、アクティブ ユーザー数 1,135 人、新規ユーザー数 512 人、合計収益 73.0841 が表示されています。


"rows": [
...
{
  "dimensionValues": [
    {
      "value": "20231025"
    }
  ],
  "metricValues": [
    {
      "value": "1135"
    },
    {
      "value": "512"
    },
    {
      "value": "73.0841"
    }
  ]
},
...
],
レスポンスを読み上げる
レポート レスポンスには、ヘッダーとデータ行が含まれます。ヘッダーは DimensionHeaders と MetricHeaders で構成され、レポート内の列を一覧表示します。各行は DimensionValues と MetricValues で構成されます。列の順序は、リクエスト、ヘッダー、行で一貫している。

前のサンプル リクエストに対するレスポンスの例を次に示します。


{
  "dimensionHeaders": [
    {
      "name": "country"
    }
  ],
  "metricHeaders": [
    {
      "name": "activeUsers",
      "type": "TYPE_INTEGER"
    }
  ],
  "rows": [
    {
      "dimensionValues": [
        {
          "value": "Japan"
        }
      ],
      "metricValues": [
        {
          "value": "2541"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "France"
        }
      ],
      "metricValues": [
        {
          "value": "12"
        }
      ]
    }
  ],
  "metadata": {},
  "rowCount": 2
}
データをグループ化、フィルタする
ディメンションは、データをグループ化およびフィルタリングするために使用できる質的な属性です。たとえば、city ディメンションは、各イベントが発生した市区町村（Paris や New York など）を表します。runReport リクエストではディメンションは省略可能です。リクエストごとに使用できるディメンションは 9 個までです。

データのグループ化とフィルタリングに使用できるディメンションの一覧については、API ディメンションをご覧ください。

グループ
アクティブ ユーザーを 3 つのディメンションにグループ化するリクエストの例を次に示します。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
    "dimensions": [
      {
        "name": "country"
      },
      {
        "name": "region"
      },
      {
        "name": "city"
      }
    ],
    "metrics": [{ "name": "activeUsers" }]
  }
  ```
前のリクエストのサンプル レポート行を次に示します。この行は、指定した期間に、南アフリカのケープタウンでイベントが発生したアクティブ ユーザーが 47 人いたことを示しています。


"rows": [
...
{
  "dimensionValues": [
    {
      "value": "South Africa"
    },
    {
      "value": "Western Cape"
    },
    {
      "value": "Cape Town"
    }
  ],
  "metricValues": [
    {
      "value": "47"
    }
  ]
},
...
],
フィルタ
特定のディメンション値のデータのみを含むレポートを生成します。ディメンションをフィルタするには、dimensionFilter フィールドに FilterExpression を指定します。

date ごとに eventName が first_open の場合に eventCount の時系列レポートを返す例を次に示します。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
    "dimensions": [{ "name": "date" }],
    "metrics": [{ "name": "eventCount" }],
    "dimensionFilter": {
      "filter": {
        "fieldName": "eventName",
        "stringFilter": {
          "value": "first_open"
        }
      }
    },
  }
次の FilterExpression の例では、andGroup には式リストのすべての条件を満たすデータのみが含まれます。この dimensionFilter は、browser が Chrome で、countryId が US の両方の場合に選択されます。

HTTP
Java
PHP
Python
Node.js

...
"dimensionFilter": {
  "andGroup": {
    "expressions": [
      {
        "filter": {
          "fieldName": "browser",
          "stringFilter": {
            "value": "Chrome"
          }
        }
      },
      {
        "filter": {
          "fieldName": "countryId",
          "stringFilter": {
            "value": "US"
          }
        }
      }
    ]
  }
},
...
orGroup には、式リストのいずれかの条件を満たすデータが含まれます。

notExpression は、内部式に一致するデータを除外します。pageTitle が My Homepage でない場合にのみデータを返す dimensionFilter は次のとおりです。レポートには、My Homepage 以外のすべての pageTitle のイベントデータが表示されます。

HTTP
Java
PHP
Python
Node.js

...
"dimensionFilter": {
  "notExpression": {
    "filter": {
      "fieldName": "pageTitle",
      "stringFilter": {
        "value": "My Homepage"
      }
    }
  }
},
...
inListFilter は、リスト内の任意の値のデータと一致します。イベントデータを返す dimensionFilter の例を次に示します。ここで、eventName は purchase、in_app_purchase、app_store_subscription_renew のいずれかです。

HTTP
Java
PHP
Python
Node.js

...
"dimensionFilter": {
    "filter": {
      "fieldName": "eventName",
      "inListFilter": {
        "values": ["purchase",
        "in_app_purchase",
        "app_store_subscription_renew"]
      }
    }
  },
...
長いレポートを操作する
デフォルトでは、レポートには最初の 10,000 行のイベントデータのみが含まれます。レポートに最大 250,000 行を表示するには、RunReportRequest に "limit": 250000 を含めます。

250,000 行を超えるレポートの場合は、一連のリクエストを送信して結果をページングする必要があります。たとえば、最初の 250,000 行を取得するリクエストは次のようになります。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    ...
    "limit": 250000,
    "offset": 0
  }
レスポンスの rowCount パラメータは、リクエストの limit 値と offset 値に関係なく、行の合計数を示します。たとえば、レスポンスに "rowCount": 572345 と表示されている場合、3 つのリクエストが必要です。

offset	limit	返される行番号の範囲
0	250000	[ 0, 249999]
250000	250000	[250000, 499999]
500000	250000	[500000, 572345]
次の 250,000 行のリクエストの例を次に示します。dateRange、dimensions、metrics など、他のすべてのパラメータは最初のリクエストと同じにする必要があります。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    ...
    "limit": 250000,
    "offset": 250000
  }
注: Data API のレスポンスが表形式であるため、Data API のページネーション ロジックは、他の Google API の一般的なページネーション設計パターンとは異なります。
複数の期間を使用する
1 つのレポート リクエストで複数の dateRanges のデータを取得できます。たとえば、このレポートは 2022 年と 2023 年の 8 月の最初の 2 週間を比較しています。

HTTP
Java
PHP
Python
Node.js

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "dateRanges": [
      {
        "startDate": "2022-08-01",
        "endDate": "2022-08-14"
      },
      {
        "startDate": "2023-08-01",
        "endDate": "2023-08-14"
      }
    ],
    "dimensions": [{ "name": "platform" }],
    "metrics": [{ "name": "activeUsers" }]
  }
リクエストに複数の dateRanges を含めると、dateRange 列がレスポンスに自動的に追加されます。dateRange 列が date_range_0 の場合、その行のデータは最初の期間の日付です。dateRange 列が date_range_1 の場合、その行のデータは 2 番目の日付範囲のデータです。

2 つの期間に対するレスポンスの例を次に示します。


{
  "dimensionHeaders": [
    {
      "name": "platform"
    },
    {
      "name": "dateRange"
    }
  ],
  "metricHeaders": [
    {
      "name": "activeUsers",
      "type": "TYPE_INTEGER"
    }
  ],
  "rows": [
    {
      "dimensionValues": [
        {
          "value": "iOS"
        },
        {
          "value": "date_range_0"
        }
      ],
      "metricValues": [
        {
          "value": "774"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "Android"
        },
        {
          "value": "date_range_1"
        }
      ],
      "metricValues": [
        {
          "value": "335"
        }
      ]
    },
    ...
  ],
}

概要

bookmark_border
Google アナリティクス Data API v1 を使用すると、ピボット テーブルを生成できます。ピボット テーブルは、1 つ以上のディメンションでデータをピボット（回転）して表内の情報を並べ替えることで、データを可視化するデータ要約ツールです。

たとえば、次の元データの表について考えてみましょう。

元データの表

このデータを使用してピボット テーブルを作成すると、セッション データをブラウザ別に分類し、国と言語のディメンションを追加のピボットとして選択できます。

ピボットされたデータ表

注: Google アナリティクス Reporting API v4（ユニバーサル アナリティクス プロパティのみ）から Google アナリティクス Data API v1（Google アナリティクス プロパティのみ）への既存のコードの移行については、移行ガイドをご覧ください。
コア レポートとの共通機能
ピボット レポート リクエストは、多くの共有機能について、コア レポート リクエストと同じセマンティクスを持ちます。たとえば、ページネーション、ディメンション フィルタ、ユーザー プロパティは、ピボット レポートとコア レポートで同じように動作します。このガイドでは、ピボット レポート機能について説明します。Data API v1 のコア レポート機能を理解するには、レポートの基本ガイドと高度なユースケースガイドをご覧ください。

ピボット レポートの方法
Data API v1 では、次のレポート作成メソッドでピボット機能がサポートされています。

runPivotReport: このメソッドは、Google アナリティクス イベント データのカスタマイズされたピボット レポートを返します。各ピボットには、レポート レスポンスに表示されるディメンションの列と行が記述されます。

batchRunPivotReports: runPivotReport メソッドのバッチ バージョンです。1 回の API 呼び出しで複数のレポートを作成できます。

レポート対象エンティティの選択
Data API v1 のすべてのメソッドでは、Google アナリティクス プロパティ ID を URL リクエスト パス内に properties/GA_PROPERTY_ID の形式で指定する必要があります。次に例を示します。


  POST  https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runPivotReport
生成されるレポートは、指定した Google アナリティクス プロパティで収集された Google アナリティクスのイベントデータに基づいて生成されます。

Data API クライアント ライブラリのいずれかを使用している場合は、リクエスト URL パスを手動で操作する必要はありません。ほとんどの API クライアントでは、文字列が properties/GA_PROPERTY_ID の形式の property パラメータが提供されています。クライアント ライブラリの使用例については、クイック スタートガイドをご覧ください。

ピボット レポートのリクエスト
ピボット テーブルを含むリクエストを作成するには、runPivotReport メソッドまたは batchRunPivotReports メソッドを使用します。

ピボット データをリクエストするには、RunPivotReportRequest オブジェクトを作成します。最初は、次のリクエスト パラメータを使用することをおすすめします。

dateRanges フィールドに有効なエントリ。
dimensions フィールドに有効なエントリが 1 つ以上ある。
metrics フィールドの 1 つ以上の有効なエントリ。
ピボット フィールドに少なくとも 2 つの有効なピボット エントリ。
推奨されるフィールドを含むリクエストの例を次に示します。

HTTP

POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runPivotReport
  {
    "dateRanges": [{ "startDate": "2020-09-01", "endDate": "2020-09-15" }],
    "dimensions": [
        { "name": "browser" },
        { "name": "country" },
        { "name": "language" }
      ],
    "metrics": [{ "name": "sessions" }],
    "pivots": [
      {
        "fieldNames": [
          "browser"
        ],
        "limit": 5
      },
      {
        "fieldNames": [
          "country"
        ],
        "limit": 250
      },
      {
        "fieldNames": [
          "language"
        ],
        "limit": 15
      }
    ]
  }
ピボット
リクエスト本文の pivot フィールドで ピボット オブジェクトを使用して、レポートのピボットを定義します。各 Pivot には、レポート レスポンスに表示されるディメンションの列と行が記述されます。

Data API v1 では、各ピボットの limit パラメータの積が 100,000 を超えない限り、複数のピボットがサポートされます。

以下に、pivots を使用して、国別セッション数のレポートを browser ディメンションでピボット表示するスニペットを示します。並べ替えに orderBys フィールドを使用し、ページ分けを実装するために limit フィールドと offset フィールドを使用していることに注目してください。


    "pivots": [
      {
        "fieldNames": [
          "country"
        ],
        "limit": 250,
        "orderBys": [
          {
            "dimension": {
              "dimensionName": "country"
            }
          }
        ]
      },
      {
        "fieldNames": [
          "browser"
        ],
        "offset": 3,
        "limit": 3,
        "orderBys": [
          {
            "metric": {
              "metricName": "sessions"
            },
            "desc": true
          }
        ]
      }
    ],
    ...
ディメンション
ディメンションは、ウェブサイトまたはアプリのイベントデータを記述し、グループ化します。たとえば、city ディメンションは、各イベントが発生した都市（「パリ」や「ニューヨーク」など）を表します。レポート リクエストでは、0 個以上のディメンションを指定できます。

ディメンションは、リクエスト本文の dimensions フィールド内で定義する必要があります。レポートに表示するには、これらのディメンションを Pivot オブジェクトの fieldNames フィールドに登録する必要があります。ピボットクエリのピボット オブジェクトで定義されていないディメンションは、レポートに表示されません。ピボットの fieldNames にすべてのディメンションを指定する必要はありません。ディメンションはフィルタでのみ使用できます。ピボットの fieldNames では使用できません。

以下は、browser、country、language ピボットを含むテーブルで dimension フィールドと fieldNames フィールドを使用するスニペットです。


    "pivots": [
      {
        "fieldNames": [
          "browser"
        ],
        "limit": 5,
        "orderBys": [
          {
            "metric": {
              "metricName": "sessions"
            },
            "desc": true
          }
        ]
      },
      {
        "fieldNames": [
          "country"
        ],
        "limit": 250,
        "orderBys": [
          {
            "dimension": {
              "dimensionName": "country"
            }
          }
        ]
      },
      {
        "fieldNames": [
          "language"
        ],
        "limit": 10
      }
    ],
指標
指標とは、ウェブサイトまたはアプリのイベントデータの定量的な測定値です。レポート リクエストでは、1 つ以上の指標を指定できます。リクエストで指定できる API 指標名の一覧については、API 指標をご覧ください。

ピボット レポート リクエストでは、コア レポート メソッドと同様に、リクエスト本文の metrics フィールドを使用して指標が定義されます。

次の例では、レポートの指標値として使用されるセッション数を指定しています。


    "metrics": [
      {
        "name": "sessions"
      }
    ],
指標の集計
ピボット オブジェクトの metricAggregations フィールドを使用して、各ピボットの集計指標値を計算します。

集計は、リクエストで metricAggregations フィールドが指定されている場合にのみ計算されます。

以下は、browser ピボット ディメンションの合計をリクエストするクエリのスニペットです。


"pivots": [
  {
    "fieldNames": [
      "browser"
    ],
    "limit": 10,
    "metricAggregations": [
      "TOTAL",
    ]
  },
  ...
計算された指標は、RunPivotReportResponse オブジェクトの aggregates フィールドに返されます。集計された指標の行では、dimensionValues フィールドには RESERVED_TOTAL、RESERVED_MAX、RESERVED_MIN という特別な値が含まれます。


  "aggregates": [
    {
      "dimensionValues": [
        {
          "value": "Chrome"
        },
        {
          "value": "RESERVED_TOTAL"
        },
        {
          "value": "RESERVED_TOTAL"
        }
      ],
      "metricValues": [
        {
          "value": "4"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "Firefox"
        },
        {
          "value": "RESERVED_TOTAL"
        },
        {
          "value": "RESERVED_TOTAL"
        }
      ],
      "metricValues": [
        {
          "value": "6"
        }
      ]
    },
  ....

  }
ページネーション
Core Reporting メソッドと同様に、ピボット リクエストでは、ピボット オブジェクトの 上限フィールドとオフセット フィールドを指定して、ページネーションを実装できます。ページ設定は、ピボットごとに個別に適用されます。レポートのカーディナリティを制限するには、Pivot オブジェクトごとに limit フィールドが必要です。

Data API v1 では、各ピボットの limit パラメータの積が 100,000 を超えない限り、複数のピボットがサポートされます。

次のスニペットは、offset フィールドと limit フィールドを使用して、オフセット 10 で次の 5 つの language ディメンションを取得する方法を示しています。


      {
        "fieldNames": [
          "language"
        ],
        "offset": 10,
        "limit": 5
      }
フィルタリング
コア レポート機能と同様に、ピボット レポート リクエストでディメンションのフィルタ処理が必要な場合は、リクエスト スコープのディメンション フィルタを使用する必要があります。

並べ替え
ピボット レポート クエリの並べ替え動作は、Pivot オブジェクトの orderBys フィールドを使用して、ピボットごとに個別に制御できます。このフィールドには、OrderBy オブジェクトのリストが含まれています。

すべての OrderBy には次のいずれかを含めることができます。

DimensionOrderBy: 結果をディメンションの値で並べ替えます。
MetricOrderBy: 結果を指標の値で並べ替えます。
PivotOrderBy: ピボットクエリで使用され、ピボット列グループ内で指標の値で結果を並べ替えます。
この例は、レポートを browser ディメンションでピボットし、結果を sessions 指標で降順に並べ替えるピボット定義のスニペットを示しています。


      {
        "fieldNames": [
          "browser"
        ],
        "limit": 5,
        "orderBys": [
          {
            "metric": {
              "metricName": "sessions"
            },
            "desc": true
          }
        ]
      }
報告の返信
ピボット レポート API リクエストの ピボット レポート レスポンスは、主にヘッダーと行です。

レスポンス ヘッダー
ピボット レポートのヘッダーは、ピボット レポートの列を一覧表示する PivotHeaders、DimensionHeaders、MetricHeaders で構成されています。

たとえば、browser、country、language のピボット ディメンションと sessions 指標を含むレポートでは、次のようなヘッダーが生成されます。


{
  "pivotHeaders": [
    {
      "pivotDimensionHeaders": [
        {
          "dimensionValues": [
            {
              "value": "Chrome"
            }
          ]
        },
        {
          "dimensionValues": [
            {
              "value": "Firefox"
            }
          ]
        },
        ...

      ],
      ...
    },
    {
      "pivotDimensionHeaders": [
        {
          "dimensionValues": [
            {
              "value": "United States"
            }
          ]
        },
        {
          "dimensionValues": [
            {
              "value": "Canada"
            }
          ]
        },
        ...

      ],
      ...
    },
    {
      "pivotDimensionHeaders": [
        {
          "dimensionValues": [
            {
              "value": "English"
            }
          ]
        },
        {
          "dimensionValues": [
            {
              "value": "French"
            }
          ]
        },
        ...

      ],
      ...
    }
  ],
  "dimensionHeaders": [
    {
      "name": "browser"
    },
    {
      "name": "country"
    },
    {
      "name": "language"
    }
  ],
  "metricHeaders": [
    {
      "name": "sessions",
      "type": "TYPE_INTEGER"
    }
  ],
  ...

}
次の図は、ピボット レポートのレスポンスの各コンポーネントがピボット レポートのレンダリングで果たす役割を示しています。

元データの表

レスポンス行
runPivotReport メソッドと batchRunPivotReports メソッドのピボット レポート レスポンスは、各ピボット レポート レスポンスの行が表の 1 つのセルを表すの点が、runReport メソッドや batchRunReports メソッドなどのコア レポート メソッドのレスポンスと異なります。通常のレポートでは、1 つのレスポンスの行が表の行全体を表します。

以下は、browser、country、language のピボット ディメンションと sessions 指標を含むクエリに対するピボット レポート レスポンスのフラグメントです。ピボット レポートの各セルは個別に返されます。


  "rows": [
    {
      "dimensionValues": [
        {
          "value": "Chrome"
        },
        {
          "value": "United States"
        },
        {
          "value": "English"
        }
      ],
      "metricValues": [
        {
          "value": "1"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "Firefox"
        },
        {
          "value": "Canada"
        },
        {
          "value": "French"
        }
      ],
      "metricValues": [
        {
          "value": "3"
        }
      ]
    },
    ...

  ]
このデータは、次の表でハイライト表示されている 2 つのセルに対応しています。

元データの表

クライアント ライブラリ
クライアント ライブラリのインストールと構成方法については、クイック スタートガイドをご覧ください。

次の例では、クライアント ライブラリを使用してピボットクエリを実行し、ブラウザ ディメンションでピボット表示した国別のセッション数のレポートを作成します。

PHP
Python
Node.js
google-analytics-data/src/run_pivot_report.phpCloud Shell で開く GitHub で表示

use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\OrderBy\DimensionOrderBy;
use Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy;
use Google\Analytics\Data\V1beta\Pivot;
use Google\Analytics\Data\V1beta\RunPivotReportRequest;
use Google\Analytics\Data\V1beta\RunPivotReportResponse;

/**
 * Runs a pivot query to build a report of session counts by country,
 * pivoted by the browser dimension.
 * @param string $propertyId Your GA-4 Property ID
 */
function run_pivot_report(string $propertyId)
{
    // Create an instance of the Google Analytics Data API client library.
    $client = new BetaAnalyticsDataClient();

    // Make an API call.
    $request = (new RunPivotReportRequest())
        ->setProperty('properties/' . $propertyId)
        ->setDateRanges([new DateRange([
            'start_date' => '2021-01-01',
            'end_date' => '2021-01-30',
            ]),
        ])
        ->setPivots([
            new Pivot([
                'field_names' => ['country'],
                'limit' => 250,
                'order_bys' => [new OrderBy([
                    'dimension' => new DimensionOrderBy([
                        'dimension_name' => 'country',
                    ]),
                ])],
            ]),
            new Pivot([
                'field_names' => ['browser'],
                'offset' => 3,
                'limit' => 3,
                'order_bys' => [new OrderBy([
                    'metric' => new MetricOrderBy([
                        'metric_name' => 'sessions',
                    ]),
                    'desc' => true,
                ])],
            ]),
        ])
        ->setMetrics([new Metric(['name' => 'sessions'])])
        ->setDimensions([
            new Dimension(['name' => 'country']),
            new Dimension(['name' => 'browser']),
        ]);
    $response = $client->runPivotReport($request);

    printPivotReportResponse($response);
}

/**
 * Print results of a runPivotReport call.
 * @param RunPivotReportResponse $response
 */
function printPivotReportResponse(RunPivotReportResponse $response)
{
    print 'Report result: ' . PHP_EOL;

    foreach ($response->getRows() as $row) {
        printf(
            '%s %s' . PHP_EOL,
            $row->getDimensionValues()[0]->getValue(),
            $row->getMetricValues()[0]->getValue()
        );
    }
}
デモ アプリケーション
JavaScript を使用してピボット レポートを作成して表示する方法の例については、Google Analytics API v1 ピボット レポートのデモ アプリケーションをご覧ください。

高度な使用例

bookmark_border
このドキュメントでは、Google アナリティクス Data API v1 の高度な機能について説明します。API の詳細なリファレンスについては、API リファレンスをご覧ください。

カスタム定義を一覧表示してレポートを作成する
Data API を使用すると、登録済みのカスタム ディメンションとカスタム指標に関するレポートを作成できます。Metadata API メソッドを使用すると、プロパティに登録されているカスタム定義の API 名を一覧表示できます。これらの API 名は、runReport メソッドへのレポート リクエストで使用できます。

以降のセクションでは、各タイプのカスタム定義の例を示します。これらの例では、GA_PROPERTY_ID はプロパティ ID に置き換えてください。

イベント スコープのカスタム ディメンション
ステップ 1: プロパティ ID を使用して Metadata API Method をクエリします。


GET https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID/metadata
ステップ 2: レポートの作成対象となるイベント スコープのカスタム ディメンションをレスポンスから探します。ディメンションが存在しない場合は、ディメンションを登録する必要があります。


"dimensions": [
...
    {
      "apiName": "customEvent:achievement_id",
      "uiName": "Achievement ID",
      "description": "An event scoped custom dimension for your Analytics property."
    },
...
],
ステップ 3: レポート リクエストにカスタム ディメンションを含めます。runReport メソッドに対するリクエストの例を次に示します。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dateRanges": [{ "startDate": "2020-09-01", "endDate": "2020-09-15" }],
  "dimensions": [{ "name": "customEvent:achievement_id" }],
  "metrics": [{ "name": "eventCount" }]
}
ユーザー スコープのカスタム ディメンション
ステップ 1: プロパティ ID を使用して Metadata API Method をクエリします。


GET https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID/metadata
ステップ 2: レポートの作成対象となるユーザー スコープのカスタム ディメンションをレスポンスから探します。ディメンションが存在しない場合は、ディメンションを登録する必要があります。


"dimensions": [
...
    {
      "apiName": "customUser:last_level",
      "uiName": "Last level",
      "description": "A user property for your Analytics property."
    },
...
],
ステップ 3: レポート リクエストにカスタム ディメンションを含めます。runReport メソッドに対するリクエストの例を次に示します。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "entity": { "propertyId": "GA_PROPERTY_ID" },
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "customUser:last_level" }],
  "metrics": [{ "name": "activeUsers" }]
}
イベント スコープのカスタム指標
ステップ 1: プロパティ ID を使用して Metadata API Method をクエリします。


GET https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID/metadata
ステップ 2: レポートの作成対象となるイベント スコープのカスタム指標をレスポンスから探します。指標が存在しない場合は、指標を登録する必要があります。


"metrics": [
...
    {
      "apiName": "customEvent:credits_spent",
      "uiName": "Credits Spent",
      "description": "An event scoped custom metric for your Analytics property.",
      "type": "TYPE_STANDARD"
    },
...
],
ステップ 3: レポート リクエストにカスタム指標を含めます。runReport メソッドに対するリクエストの例を次に示します。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dateRanges": [{ "startDate": "30daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "eventName" }],
  "metrics": [{ "name": "customEvent:credits_spent" }]
}
1 つのキーイベントのキーイベント率指標
ステップ 1: プロパティ ID を使用して Metadata API メソッドをクエリします。


GET https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID/metadata
ステップ 2: レポートの作成対象となる 1 つのキーイベントのキーイベント率の指標をレスポンスから探します。キーイベントが存在しない場合は、キーイベントを設定する必要があります。


"metrics": [
...
    {
      "apiName": "sessionKeyEventRate:add_to_cart",
      "uiName": "Session key event rate for add_to_cart",
      "description": "The percentage of sessions in which a specific key event was triggered",
    },
...
],
ステップ 3: レポート リクエストにキーイベント率の指標を含めます。次の例は、runReport メソッドに対するリクエストのサンプルです。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dateRanges": [{ "startDate": "30daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "eventName" }],
  "metrics": [{ "name": "sessionKeyEventRate:add_to_cart" }]
}
イベント スコープのカスタム指標の平均
ステップ 1: プロパティ ID を使用して Metadata API Method をクエリします。


GET https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID/metadata
ステップ 2: レポートの作成対象となるイベント スコープのカスタム指標の平均値をレスポンスから探します。指標が存在しない場合は、指標を登録する必要があります。


"metrics": [
...
    {
      "apiName": "averageCustomEvent:credits_spent",
      "uiName": "Average Credits Spent",
      "description": "The average of an event scoped custom metric for your Analytics property.",
      "type": "TYPE_STANDARD"
    },
...
],
ステップ 3: カスタム指標の平均値をレポート リクエストに含めます。runReport メソッドに対するリクエストの例を次に示します。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dateRanges": [{ "startDate": "2020-11-01", "endDate": "2020-11-10" }],
  "dimensions": [{ "name": "eventName" }],
  "metrics": [{ "name": "averageCustomEvent:credits_spent" }]
}
コホート レポートの例
コホート レポートでは、コホートのユーザー維持率の時系列が作成されます。各 API フィールドの詳細なドキュメントについては、CohortSpec の REST リファレンスをご覧ください。

コホート レポートを作成する
以下に、コホート レポートの例を示します。

コホートは、firstSessionDate が 2020-12-01 のユーザーです。これは cohorts オブジェクトで構成されます。レポート レスポンスのディメンションと指標は、コホートのユーザーのみに基づきます。
コホート レポートには 3 つの列が表示されます。これは、ディメンション オブジェクトと指標オブジェクトによって構成されます。
ディメンション cohort はコホートの名前です。
ディメンション cohortNthDay は、2020-12-01 からの日数です。
指標 cohortActiveUsers は、まだアクティブなユーザーの数です。
cohortsRange オブジェクトは、このコホートの 2020-12-01 から 2020-12-06 までのイベントデータをレポートに含めるように指定します。
粒度が DAILY の場合、整合性を確保するためにディメンション cohortNthDay を使用することをおすすめします。
コホートのレポート リクエストは次のとおりです。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dimensions": [{ "name": "cohort" }, { "name": "cohortNthDay" }],
  "metrics": [{ "name": "cohortActiveUsers" }],
  "cohortSpec": {
    "cohorts": [
      {
        "dimension": "firstSessionDate",
        "dateRange": { "startDate": "2020-12-01", "endDate": "2020-12-01" }
      }
    ],
    "cohortsRange": {
      "endOffset": 5,
      "granularity": "DAILY"
    }
  },
}
このリクエストの場合、レポート レスポンスの例は次のようになります。


{
  "dimensionHeaders": [
    { "name": "cohort" }, { "name": "cohortNthDay" }
  ],
  "metricHeaders": [
    { "name": "cohortActiveUsers", "type": "TYPE_INTEGER" }
  ],
  "rows": [
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0000" }],
      "metricValues": [{ "value": "293" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0001" }],
      "metricValues": [{ "value": "143" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0002" }],
      "metricValues": [{ "value": "123" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0003" }],
      "metricValues": [{ "value": "92" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0005" }],
      "metricValues": [{ "value": "86" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0004" }],
      "metricValues": [{ "value": "83" }]
    }
  ],
  "metadata": {},
  "rowCount": 6
}
このレポートのレスポンスから、このコホート レポートのグラフが返されます。このレポートから得られる分析情報は、このコホートのアクティブ ユーザー数が 1 日目と 2 日目で最も減少していることです。

コホート ユーザーの推移の可視化

複数のコホートおよびユーザー維持率の割合
ユーザーの獲得と維持は、ウェブサイトやアプリを成長させる方法です。コホート レポートはユーザーの維持に焦点を当てています。この例のレポートでは、このプロパティの 4 日間のユーザー維持率が 2 週間で 10% 向上したことがわかります。

このレポートを作成するには、3 つのコホートを指定します。最初のコホートの firstSessionDate は 2020-11-02、2 番目のコホートの firstSessionDate は 2020-11-09、3 番目のコホートの firstSessionDate は 2020-11-16 です。プロパティのユーザー数は 3 日間の間に異なるため、直接的な cohortActiveUsers 指標ではなく、コホートのユーザー維持率指標 cohortActiveUsers/cohortTotalUsers を比較します。

これらのコホートのレポート リクエストは次のとおりです。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dimensions": [{ "name": "cohort" },{ "name": "cohortNthDay" }],
  "metrics": [
    {
      "name": "cohortRetentionFraction",
      "expression": "cohortActiveUsers/cohortTotalUsers"
    }
  ],
  "cohortSpec": {
    "cohorts": [
      {
        "dimension": "firstSessionDate",
        "dateRange": { "startDate": "2020-11-02", "endDate": "2020-11-02" }
      },
      {
        "dimension": "firstSessionDate",
        "dateRange": { "startDate": "2020-11-09", "endDate": "2020-11-09" }
      },
      {
        "dimension": "firstSessionDate",
        "dateRange": { "startDate": "2020-11-16", "endDate": "2020-11-16" }
      }
    ],
    "cohortsRange": {
      "endOffset": 4,
      "granularity": "DAILY"
    }
  },
}
このリクエストの場合、レポート レスポンスの例は次のようになります。


{
  "dimensionHeaders": [{ "name": "cohort" },{ "name": "cohortNthDay" }],
  "metricHeaders": [{
      "name": "cohortRetentionFraction",
      "type": "TYPE_FLOAT"
    }
  ],
  "rows": [
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0000" }],
      "metricValues": [{ "value": "1" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_1" },{ "value": "0000" }],
      "metricValues": [{ "value": "1" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_2" },{ "value": "0000" }],
      "metricValues": [{ "value": "1" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_2" },{ "value": "0001" }],
      "metricValues": [{ "value": "0.308" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_1" },{ "value": "0001" }],
      "metricValues": [{ "value": "0.272" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_2" },{ "value": "0002" }],
      "metricValues": [{ "value": "0.257" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0001" }],
      "metricValues": [{ "value": "0.248" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_2" },{ "value": "0003" }],
      "metricValues": [{ "value": "0.235" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_2" },{ "value": "0004" }],
      "metricValues": [{ "value": "0.211" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_1" },{ "value": "0002" }],
      "metricValues": [{ "value": "0.198" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0002" }],
      "metricValues": [{ "value": "0.172" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_1" },{ "value": "0003" }],
      "metricValues": [{ "value": "0.167" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_1" },{ "value": "0004" }],
      "metricValues": [{ "value": "0.155" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0003" }],
      "metricValues": [{ "value": "0.141" }]
    },
    {
      "dimensionValues": [{ "value": "cohort_0" },{ "value": "0004" }],
      "metricValues": [{ "value": "0.118" }]
    }
  ],
  "metadata": {},
  "rowCount": 15
}
このレポートのレスポンスから、このコホート レポートのグラフが表示されます。このレポートから得られる分析情報は、4 日間のユーザー維持率が 2 週間で 10% 増加したことです。firstSessionDate が 2020-11-16 の後半コホートの保持率は、firstSessionDate が 2020-11-02 の前半コホートの保持率を上回っています。

複数のコホートの維持率のグラフ

週次コホート、および他の API 機能でのコホートの使用
ユーザーの行動の 1 日あたりのばらつきを除外するには、週次コホートを使用します。週単位のコホート レポートでは、同じ週に firstSessionDate を持つすべてのユーザーがコホートを形成します。週は日曜日から始まり、土曜日に終わります。また、このレポートでは、コホートをスライスして、ロシアでアクティビティがあったユーザーとメキシコでアクティビティがあったユーザーを比較しています。このスライスでは、country ディメンションと dimensionFilter を使用して、2 つの国のみを考慮します。

これらのコホートのレポート リクエストは次のとおりです。


POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
{
  "dimensions": [
    { "name": "cohort" },
    { "name": "cohortNthWeek" },
    { "name": "country" }
  ],
  "metrics": [{ "name": "cohortActiveUsers" }],
  "dimensionFilter": {
    "filter": {
      "fieldName": "country",
      "inListFilter": {
        "values": [ "Russia", "Mexico" ]
      }
    }
  },
  "cohortSpec": {
    "cohorts": [
      {
        "dimension": "firstSessionDate",
        "dateRange": {
          "startDate": "2020-10-04",
          "endDate": "2020-10-10"
        }
      }
    ],
    "cohortsRange": {
      "endOffset": 5,
      "granularity": "WEEKLY"
    }
  },
}
このリクエストの場合、レポート レスポンスの例は次のようになります。


{
  "dimensionHeaders": [
    { "name": "cohort" },
    { "name": "cohortNthWeek" },
    { "name": "country" }
  ],
  "metricHeaders": [
    { "name": "cohortActiveUsers", "type": "TYPE_INTEGER" }
  ],
  "rows": [
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0000" },{ "value": "Russia" }
      ],
      "metricValues": [{ "value": "105" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0000" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "98" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0001" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "35" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0002" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "24" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0001" },{ "value": "Russia" }
      ],
      "metricValues": [{ "value": "23" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0004" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "17" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0003" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "15" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0005" },{ "value": "Mexico" }
      ],
      "metricValues": [{ "value": "15" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0002" },{ "value": "Russia" }
      ],
      "metricValues": [{ "value": "3" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0003" },{ "value": "Russia" }
      ],
      "metricValues": [{ "value": "1" }]
    },
    {
      "dimensionValues": [
        { "value": "cohort_0" },{ "value": "0004" },{ "value": "Russia" }
      ],
      "metricValues": [{ "value": "1" }]
    }
  ],
  "metadata": {},
  "rowCount": 11
}
このレポートのレスポンスに、このコホート レポートのグラフが続きます。このレポートによると、この宿泊施設は、メキシコでアクティビティがあるユーザーの維持率が、ロシアでアクティビティがあるユーザーの維持率よりも高いです。

国別の比較コホートのチャート

比較
比較を使用すると、データのサブセットを並べて評価できます。比較を定義するには、レポート定義で comparisons フィールドを指定します。Data API の比較機能は、Google アナリティクスのフロントエンドの比較機能に似ています。

各 API フィールドの詳細については、比較用の REST リファレンスをご覧ください。

比較を作成する
比較するデータセットごとに個別の比較を作成できます。たとえば、アプリのデータとウェブのデータを比較するには、Android と iOS のデータ用の比較と、ウェブデータ用の比較を個別に作成することが可能です。

次に、2 つの比較を定義し、アクティブ ユーザーを国別に返すレポートの例を示します。

「アプリ トラフィック」という名前の最初の比較では、inListFilter を使用して、値が「iOS」と「Android」の platform ディメンションと一致させています。2 つ目の比較「ウェブ トラフィック」では、stringFilter を使用して platform ディメンションを「ウェブ」と照合しています。


  POST https://analyticsdata.googleapis.com/v1beta/properties/GA_PROPERTY_ID:runReport
  {
    "comparisons": [
      {
        "name": "App traffic",
        "dimensionFilter": {
          "filter": {
            "fieldName": "platform",
            "inListFilter": {
              "values": [
                "iOS",
                "Android"
              ]
            }
          }
        }
      },
      {
        "name": "Web traffic",
        "dimensionFilter": {
          "filter": {
            "fieldName": "platform",
            "stringFilter": {
              "matchType": "EXACT",
              "value": "web"
            }
          }
        }
      }
    ],
    "dateRanges": [
      {
        "startDate": "2024-05-01",
        "endDate": "2024-05-15"
      }
    ],
    "dimensions": [
      {
        "name": "country"
      }
    ],
    "metrics": [
      {
        "name": "activeUsers"
      }
    ]
  }
比較機能を使用するすべてのリクエストで、生成されたレポートに comparison フィールドが自動的に追加されます。このフィールドには、リクエストで指定された比較の名前が含まれます。

比較を含むレスポンスのサンプル スニペットを次に示します。


{
  "dimensionHeaders": [
    {
      "name": "comparison"
    },
    {
      "name": "country"
    }
  ],
  "metricHeaders": [
    {
      "name": "activeUsers",
      "type": "TYPE_INTEGER"
    }
  ],
  "rows": [
    {
      "dimensionValues": [
        {
          "value": "Web traffic"
        },
        {
          "value": "United States"
        }
      ],
      "metricValues": [
        {
          "value": "638572"
        }
      ]
    },
    {
      "dimensionValues": [
        {
          "value": "Web traffic"
        },
        {
          "value": "Japan"
        }
      ],
      "metricValues": [
        {
          "value": "376578"
        }
      ]
    },
  {
      "dimensionValues": [
        {
          "value": "App traffic"
        },
        {
          "value": "United States"
        }
      ],
      "metricValues": [
        {
          "value": "79527"
        }
      ]
    },

    ...

  ],

...

}Google アナリティクスの UI と BigQuery エクスポートのギャップを埋める

bookmark_border
Minhaz Kazi（Google アナリティクス デベロッパー アドボケイト） - 2023 年 4 月


「でも、どうして数字が UI と合わないんだろう？」

BigQuery で GA4 プロパティのイベント エクスポート データを扱ったことがあれば、きっと一度は疑問に思ったことがあるはずです。もっと困るのは、他の人から同じ質問をされた場合です。そして、なんとか回答しようとしているときに追い打ちをかけてくるのがこの質問です。

「で、どこにそう書いてあるの？」

この記事では、両方の問題に光を当てていきたいと思います。

数値の差異について詳しく見ていく前に、BigQuery イベント エクスポート データの本来の用途を理解しておくことが重要です。Google アナリティクスのユーザーは、いずれかの収集方法（Google タグ、Google タグ マネージャー、Measurement Protocol、SDK、またはデータ インポート）を通して、Google アナリティクスに収集データを送信します。Google アナリティクスは各 GA プロパティの設定に応じて、収集したデータにさまざまな価値付加を行ったうえで、標準レポート サーフェス（通常のレポート、データ探索ツール、Data API）に出力します。価値付加とはたとえば、Google シグナルの組み込み、モデリング、トラフィック アトリビューション、予測などを指します。

Google アナリティクスの標準のレポート画面は、最大限の価値を可能な限りスムーズに提供することを目指した設計となっています。しかしながらユーザーのニーズはさまざまで、Google アナリティクスによる価値付加をさらに拡充したいケースや、出力を抜本的にカスタマイズしたいケースもあるはずです。こうした運用の起点としてご用意しているのが、BigQuery イベント エクスポートです。BigQuery イベント エクスポートに含まれるのは、クライアントやアプリから Google アナリティクスに送信される、収集したままのデータです。前述の付加価値要素の多くについては、BigQuery イベント エクスポートには詳細なデータは含まれません。

このため、多くのユースケースにおいては、前述の付加価値要素に関する部分で、標準レポート サーフェスと BigQuery エクスポート データの間に完全な対応関係を求めることは想定されていません。それぞれのデータの中で整合性が保たれており、収集した情報とも合致していれば、問題ないと考えていいでしょう。

それでは、データに差異が生じる具体的な原因と、（可能な場合は）影響を緩和する方法を確認していきましょう。なお、この記事では BigQuery の日次イベント エクスポートに絞って説明し、ストリーミング エクスポートは扱いません。

サンプリング
BigQuery Export のデータと、標準レポート、Data API レポート、データ探索ツールレポートを正確に比較するには、それらがサンプリング データに基づいたものではないことを確認します。詳細とサンプリングへの対処方法は、GA4 のデータ サンプリングに関する記事でご確認いただけます。

アクティブ ユーザー
GA4 プロパティでイベントを 1 件でも発生させたユーザーの数をカウントした場合、得られるのは「合計ユーザー数」指標の値です。「合計ユーザー数」指標は、GA4 の UI 内でもデータ探索ツールを通して利用できますが、GA4 で主に使用されるユーザー数の指標は「アクティブ ユーザー数」であることに注意が必要です。GA4 の UI やレポート類で単に「ユーザー数」とあれば、それは通常「アクティブ ユーザー数」を指しています。したがって、BigQuery のデータをもとにユーザー数を算出する場合、Google アナリティクスの UI と比較可能な値を得るには、アクティブ ユーザーだけを抽出してカウントする必要があります。適切な計算方法は、使用しているレポート用識別子によっても異なります。

技術的な実装
BigQuery イベント エクスポート データで、互いに異なるユーザー ID の数をカウントした場合、得られるのは「合計ユーザー数」です。次のサンプルクエリでは、user_pseudo_id をもとに、合計ユーザー数と新規ユーザー数の両方を求めています。


-- Example: Get 'Total User' count and 'New User' count.

WITH
  UserInfo AS (
    SELECT
      user_pseudo_id,
      MAX(IF(event_name IN ('first_visit', 'first_open'), 1, 0)) AS is_new_user
    -- Replace table name.
    FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
    -- Replace date range.
    WHERE _TABLE_SUFFIX BETWEEN '20201101' AND '20201130'
    GROUP BY 1
  )
SELECT
  COUNT(*) AS user_count,
  SUM(is_new_user) AS new_user_count
FROM UserInfo;
アクティブなユーザーのみ選択するには、クエリの対象を、is_active_user が true であるイベントに限定します。


-- Example: Get exact and approximate Active User count.

WITH
  ActiveUsers AS (
    SELECT
      user_pseudo_id
    -- Replace table name.
    FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
    -- Replace date range.
    WHERE _TABLE_SUFFIX BETWEEN '20201101' AND '20201130'
      AND is_active_user
    GROUP BY 1
  )
SELECT
  COUNT(DISTINCT user_pseudo_id) AS exact_active_user_count,
  APPROX_COUNT_DISTINCT(user_pseudo_id) AS approx_active_user_count
FROM ActiveUsers;
HyperLogLog++
Google アナリティクスは、一般的な指標（アクティブ ユーザー数、セッション数など）の基数を、HyperLogLog++（HLL++）アルゴリズムによって推定しています。よって、これらの指標のユニーク カウントを UI 内または API 経由で参照した場合、得られるのは一定の精度を持つ近似値です。これに対して BigQuery では詳細なデータを参照できるため、各指標の厳密な基数を計算することが可能です。そのため、両者の指標の値にはわずかな割合で差異が生じることがあります。たとえばセッション数の精度は、95% 信頼区間で ±1.63% などになります。精度は指標ごとに異なり、信頼区間によっても変化します。HLL++ の精度（適合率）パラメータに応じた、各信頼区間における精度は、HLL++ スケッチでご確認いただけます。

技術的な実装
Google アナリティクスにおける HLL++ の実装と、同じ機能を BigQuery のクエリで再現する方法については、Google アナリティクスにおけるユニーク カウントの近似値をご覧ください。

データ収集の遅延
日次エクスポート テーブルは、Google アナリティクスがその日のイベントの収集を終えてから作成されます。該当日のタイムスタンプを持つイベントが後追いで追加されることもあるため、日次テーブルの更新は、その日が終わってから最大で 72 時間後まで続きます（詳細と具体例をご覧ください）。このことは、使用している Firebase SDK または Measurement Protocol 実装からオフラインのイベントや遅延イベントが送られてくる場合に問題となります。前述の 72 時間の間に、標準レポート サーフェスと BigQuery のデータ更新がそれぞれどのタイミングで行われるかによって、両者のデータに差異が生じる可能性があるためです。このような実装において両者のデータを比較する場合は、72 時間以上前のデータを使用しましょう。

基数の大きいレポート
たとえば、通常のレポートまたは Data API を使用している場合に、レポートを通して参照するデータの規模が大きく、基数の大きいディメンションが含まれていたとしましょう。高基数ディメンションを含むレポートは、もとになっているテーブルの基数の上限を超えてしまう可能性があります。この場合、Google アナリティクスは頻度の低い値を「（other）」というラベルでグループ化します。

以下は単純化した小スケールの例ですが、もとになっているテーブルの基数の上限が 10 行であれば、このように処理されます。

「（other）」行を含む集計済みテーブルと元データの違いを示す、単純化された例

このように、イベントの総数は集計後のテーブルでもそのままですが、頻度の低い値がグループ化されており、テーブルを任意のディメンションによって集計し直すことはできなくなっています（集計済みのテーブルからは、たとえば特定の都市のイベント数を高い精度で割り出すことができません）。集計データをいずれかのディメンションでフィルタ処理すれば、影響はさらに大きくなります。

「（other）」行への集約が発生するのは、レポート モジュールと Data API で、レポートが基数の上限を超えた場合のみです。BigQuery から計算を行った場合は、常に元データ（最も詳細なデータ行）が返されます。「（other）」行の詳細と、発生を回避するためのベスト プラクティスも併せてご覧ください。

Google シグナル
Google アナリティクス 4 プロパティで Google シグナルを有効化すると、さまざまなメリットがあります。プラットフォームやデバイスをまたいだユーザー重複除去もそのひとつです。User-ID と Google シグナルを有効化していない場合、ある人が 3 種類のブラウザからウェブサイトを訪問すれば、Google アナリティクスはそれを 3 人の異なるユーザーと認識し、BigQuery エクスポート データには 3 つの異なる user_pseudo_id が含まれることになります。これに対して、Google シグナルが有効化されており、ユーザーが 3 種類のブラウザで同じ Google アカウントにログインしていた場合は、Google アナリティクスはこれを 1 人のユーザーと認識し、標準レポート サーフェスでもそのように表示されます。ただし、BigQuery 側では 3 つの異なる user_pseudo_id が使用されたままになります。BigQuery エクスポート データでは、Google シグナルの情報を利用できないためです。したがって、Google シグナルのデータを使ったレポートでは、BigQuery エクスポート データよりもユーザー数が少なくなることが一般的です。

この差異を軽減したい場合は、GA4 プロパティで User-ID を実装し、Google シグナルも有効化するのがおすすめです。これにより、user_id に基づく重複除去が最初に行われます。ログイン中のユーザーについては、BigQuery が自動的に値を入力した user_id フィールドを計算に使用できます。ログインしていないユーザー（user_id を持たないセッション）については、重複除去の基準は Google シグナルのままです。

標準レポート サーフェスの一部のレポートはしきい値の適用を受けるため、一部のデータが返されない点にも注意しましょう。しきい値の適用対象となり得る情報の多くは、BigQuery エクスポート データでは利用できないことが一般的です。

同意モードとモデル推定データ
ウェブサイトやモバイルアプリの「同意モード」とは、Cookie やアプリ識別子についてのユーザーの同意ステータスを Google に伝達できる仕組みです。ユーザーが同意を拒否した場合、GA4 はコンバージョン モデリングと行動モデリングによって、データ収集のギャップを補完します。このようなモデル推計によるデータは、BigQuery イベント エクスポートでは利用できません。同意モードが実装されている場合、BigQuery のデータセットには、Google アナリティクスが収集した Cookie 不使用の ping が含まれており、各セッションはそれぞれ異なる user_pseudo_id を持ちます。モデリングによる補完が行われているため、標準レポート サーフェスと BigQuery の詳細データの間には差異が生じます。たとえば、行動モデリングによって、非同意ユーザーが複数のセッションを発生させたケースが想定されるため、アクティブ ユーザー数が BigQuery エクスポート データよりも少なく表示される可能性があります。

ここでも、影響を軽減するには GA4 プロパティに User-ID を実装するのがおすすめです。user_id とカスタム ディメンションは、ユーザーの同意ステータスを問わず、BigQuery にエクスポートされます。

トラフィック アトリビューション データ
BigQuery で利用できるのは、ユーザー（初回訪問）レベルおよびイベントレベルのトラフィック アトリビューション データです。これらは、収集データです。これに対して Google アナリティクスは、セッション レベルで独自のアトリビューション モデルを実装していますが、その情報は BigQuery のエクスポート データからは直接利用できず、利用可能なデータから正確に算出することもできません。ユースケースによっては、たとえば BigQuery データセットを任意の関連自社データと結合して、独自のアトリビューション モデルを構築するのも一案です。将来的には、トラフィック アトリビューション関連の収集データが追加され、BigQuery イベント エクスポートを通して利用できるようになる可能性もあります。

一般的な計算ミス
計算方法: BigQuery でさまざまな指標を計算する際は、正しい計算方法を選ぶ必要があります。たとえば以下の点に注意しましょう。
セッション数をカウントする際、Google アナリティクス 4 プロパティでは、user_pseudo_id / user_id と ga_session_id の組み合わせによってセッションが識別されるため、時間帯は影響しません。一方、ユニバーサル アナリティクスでは、午前 0 時にセッションがリセットされていました。ユニバーサル アナリティクスの方式で計算した 1 日ごとのセッション数をそのまま合計してしまうと、日をまたいだセッションは重複してカウントされるため、合計セッション数が過大になります。
使用しているレポート用識別子によっては、ユーザー数の計算方式をアップデートする必要があります。
ディメンションと指標のスコープ: 計算で使用するスコープ（ユーザー、セッション、アイテム、またはイベント）は正しく選びましょう。
タイムゾーン: BigQuery エクスポート データにおいて、event_date はレポートのタイムゾーンに対応しますが、event_timestamp は UTC のタイムスタンプ（マイクロ秒単位）です。このため、UI との比較に適した数値を得るには、クエリ内で event_timestamp を使用する場合は、レポートのタイムゾーンに合わせて調整する必要があります。
データのフィルタリングとエクスポートの上限: BigQuery イベント エクスポートにデータのフィルタリングを適用している場合や、日次イベント エクスポートの量が上限を超えた場合は、BigQuery イベント エクスポートのデータは、標準レポート サーフェスと一致しません。
今回の投稿は以上です。ご自身のプロジェクトに合ったソリューションを見つけて、ご活用いただければ幸いです。ご質問があれば Google アナリティクスの Discord サーバーで受け付けていますので、ぜひご活用ください。