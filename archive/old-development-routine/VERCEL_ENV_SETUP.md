# Vercel環境変数設定ガイド

## 🚀 Vercel Dashboardでの設定（推奨）

1. **Vercel Dashboard** → プロジェクト → **Settings** → **Environment Variables**
2. 以下の環境変数を **Add New** で追加：

### GA4設定
```
Name: GA4_PROPERTY_ID
Value: 463408278
Environments: Production, Preview, Development
```

```
Name: GA4_MEASUREMENT_ID  
Value: G-MBY772GM88
Environments: Production, Preview, Development
```

### Search Console設定
```
Name: SEARCH_CONSOLE_SITE_URL
Value: https://find-to-do.com/
Environments: Production, Preview, Development
```

### Google認証設定
```
Name: GOOGLE_PROJECT_ID
Value: find-to-do-analytics
Environments: Production, Preview, Development
```

```
Name: GOOGLE_PRIVATE_KEY_ID
Value: 03386839f7b20c834e1ae76318070f0ecae16c79
Environments: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_EMAIL
Value: ga4-dashboard-service@find-to-do-analytics.iam.gserviceaccount.com
Environments: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_ID
Value: 108264613799320328933
Environments: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_X509_CERT_URL
Value: https://www.googleapis.com/robot/v1/metadata/x509/ga4-dashboard-service%40find-to-do-analytics.iam.gserviceaccount.com
Environments: Production, Preview, Development
```

### **重要: GOOGLE_PRIVATE_KEY**
```
Name: GOOGLE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6JzsPc09RXONV
w8GC32Een9GHk6f1ilFY15X+mUweSd632HqMB0DtkOWAexHvjJLOs5QdP9vdwjY9
p+3LBLcRL17XwbF+SrkHWah+8DKTfe7NG6Nv6xVZOBhvO3bcFcBVXGvzRF5QVT2K
IiJu/YiJmM+prKPNV5jeBDy6fdg2EhmdrATipID7sVhRfwt+wdVgNS2BlqZjCMbY
eO7RXONPRSLOb2Qfld16NyH+1xUIarP9NeWkPELJi/OoQpiL8m5Ja3btCZnLXR8w
w6qw47sX171nSKFoEjRqiJjByTNSjOppQat8j1Syboke3nlVTJNRzvSD0q4W4z4z
twOSE7MPAgMBAAECggEAD+AKnF20FPc79/NyzEtqh+cPQmWoPDtohpAUHZtLL4YT
NVCD2u8/bUMfH17ff7NYTcJozjnE8Vt/rrBkihzD0/ZbO0Esdt2+e878nJ61YXiq
5dkGjiPZNTugcdP7ZfeA6IayOhPJi0ZJsj8I+rgqbbmXdBvh+EARLFXmK+1RhALP
scVUDSbBC6Ye5TwHS3heVZpWFDkoRcEBp5q2NX3PlJOtFD5VcIzy+GZcHwj4sBGp
YPc1gcqWbGHwNDvsOh3yROmcSh/HXKYBVmWg6JQrrvxrGUffpUJLp8rGAid3OlkY
XkwztvriEzEjAS8hNWZ9R5umZ2mTcB/2chlptmxwKQKBgQDzdfzn0QnHlTRPU7Wr
c/gRZMjWJTFM9tAmjm8bHNw7UjiUmkV91nLvRDbfFl3mVIGa6ZfnMmbrpBXzfgv3
/wNsJeeZF1Ri0a2N2cKM3MbBLdT6Xa8YwXFRCAtpv0R4Y7CtBjcqO22b9y7kN/Pt
7docsk2SrRSJLm7Xbh5tSlHZRQKBgQDDvaVpQ9xOkPy2Y9eM3JZKX4VF+bkCz5qJ
c2ICO5/MwGR4OK3sBDqiHTSu8Te9p/CLJXQy4/kmRkk5F3lAUF9ZOBYzryM23Tl8
KO1E75eVC8OMULBwdc3Hwr/5sm5QfhNPO4gZf9suN0bfSan9BSo+pVNk56U7xy61
ALCklCbeQwKBgDBWeMQ+CMcLpLsrT6Ke/93UONvrvoIdbu540S586G0OwhUfHDUD
4wYGcS6R7krQ9HqhbnuE0lJu3bzehdnTVAag7/7BVwvXvbGwTqRRIVUxmFutRhqQ
LcN86WcxhpKwmF+CIGnOKtEQnsrJITFYTDnuXOCGZNFn2rIDNx9T5jRRAoGAbvi+
pX4ukXBLhY/3LUoF/qZG5ZQdWsWeJF0A7KknAKr2it3/ZHZFU5FhQ+lHo8NpcUnL
pepvX06rxq1TNa4bUHamx6h8O2eSZpzBX7rB4mMn+w3n6eovvxffRM3vEr1Xby0e
DO7asUnvaTnXILZj695I+EUH/WsAROfePYAsxQcCgYEA8JRNXO+PkSG0+omNweTI
fN6A0g7Lu45xuDx5TlVjxim2y8AgN336zdijoyna4FZXYK2gv32p2rtdBMADH3qQ
1Cco6YtVQZpsLMuzcE5Voycxq6stsf2JRnMe3OtaHG6dJjoifw5bKMMiW/AvtYNw
u0KCr4nLbonpp10f/rpwbTM=
-----END PRIVATE KEY-----
Environments: Production, Preview, Development
```

## 🔧 CLIでの設定（代替方法）

CLIを使用する場合は、対話式で入力：

```bash
vercel env add GA4_PROPERTY_ID production
# 値入力: 463408278

vercel env add GOOGLE_PROJECT_ID production  
# 値入力: find-to-do-analytics

# ... 他の環境変数も同様
```

## ✅ 設定完了後の確認

```bash
vercel env ls
```

すべてのGA4関連環境変数が表示されることを確認してください。

## 🚀 デプロイ

環境変数設定後、デプロイを実行：

```bash
vercel --prod
```

本番環境でGA4ダッシュボードが正常に動作します。