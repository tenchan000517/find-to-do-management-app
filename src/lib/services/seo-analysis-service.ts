// SEO分析サービス
import * as cheerio from 'cheerio';

export interface SEOCheckResult {
  name: string;
  status: 'good' | 'warning' | 'error';
  description: string;
  improvement?: {
    title: string;
    description: string;
    implementation: string;
    impact: number;
  };
}

export interface SEOCategoryResult {
  score: number;
  checks: SEOCheckResult[];
}

export interface SEOAnalysisResult {
  url: string;
  overallScore: number;
  categories: {
    metaTags: SEOCategoryResult;
    performance: SEOCategoryResult;
    structuredData: SEOCategoryResult;
    technical: SEOCategoryResult;
  };
  topIssues: Array<{
    message: string;
    severity: 'high' | 'medium' | 'low';
    category: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export class SEOAnalysisService {
  async analyzePage(url: string): Promise<SEOAnalysisResult> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const headers = this.createHeadersObject(response.headers);

      const metaTags = this.analyzeMetaTags($, url);
      const performance = this.analyzePerformance($, headers);
      const structuredData = this.analyzeStructuredData($);
      const technical = this.analyzeTechnical($, url);

      const categories = { metaTags, performance, structuredData, technical };
      const overallScore = this.calculateOverallScore(categories);
      const topIssues = this.extractTopIssues(categories);
      const recommendations = this.generateRecommendations(categories);

      return {
        url,
        overallScore,
        categories,
        topIssues,
        recommendations
      };
    } catch (error) {
      console.error('SEO analysis error:', error);
      throw new Error('Failed to analyze page for SEO');
    }
  }

  private createHeadersObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private analyzeMetaTags($: any, url: string): SEOCategoryResult {
    const checks: SEOCheckResult[] = [];
    let score = 0;
    let totalChecks = 0;

    // タイトルタグ分析
    totalChecks++;
    const title = $('title').text();
    if (title) {
      const titleLength = title.length;
      if (titleLength >= 10 && titleLength <= 60) {
        checks.push({
          name: 'タイトルタグ',
          status: 'good',
          description: `タイトルの長さは適切です (${titleLength}文字)`
        });
        score += 100;
      } else {
        checks.push({
          name: 'タイトルタグ',
          status: 'warning',
          description: `タイトルが${titleLength < 10 ? '短すぎます' : '長すぎます'} (${titleLength}文字)`,
          improvement: {
            title: 'タイトルタグの最適化',
            description: 'タイトルタグは10〜60文字程度が最適です。',
            implementation: 'メインキーワードを含む魅力的なタイトルを作成',
            impact: 15
          }
        });
        score += 50;
      }
    } else {
      checks.push({
        name: 'タイトルタグ',
        status: 'error',
        description: 'タイトルタグがありません',
        improvement: {
          title: 'タイトルタグの追加',
          description: 'タイトルタグはSEOの最重要要素です',
          implementation: 'Next.js Metadataでタイトルを設定',
          impact: 20
        }
      });
    }

    // メタディスクリプション分析
    totalChecks++;
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription) {
      const descLength = metaDescription.length;
      if (descLength >= 50 && descLength <= 160) {
        checks.push({
          name: 'メタディスクリプション',
          status: 'good',
          description: `メタディスクリプションの長さは適切です (${descLength}文字)`
        });
        score += 100;
      } else {
        checks.push({
          name: 'メタディスクリプション',
          status: 'warning',
          description: `メタディスクリプションが${descLength < 50 ? '短すぎます' : '長すぎます'} (${descLength}文字)`,
          improvement: {
            title: 'メタディスクリプションの最適化',
            description: '50〜160文字でページ内容を簡潔に説明',
            implementation: 'CTRを高める魅力的な説明文を作成',
            impact: 12
          }
        });
        score += 50;
      }
    } else {
      checks.push({
        name: 'メタディスクリプション',
        status: 'error',
        description: 'メタディスクリプションがありません',
        improvement: {
          title: 'メタディスクリプションの追加',
          description: 'SERPでの表示とCTR向上に重要',
          implementation: 'Next.js Metadataで説明文を設定',
          impact: 15
        }
      });
    }

    // OGPタグ分析
    totalChecks++;
    const ogTags = {
      title: $('meta[property="og:title"]').length > 0,
      description: $('meta[property="og:description"]').length > 0,
      image: $('meta[property="og:image"]').length > 0,
      url: $('meta[property="og:url"]').length > 0
    };
    const ogCount = Object.values(ogTags).filter(Boolean).length;

    if (ogCount === 4) {
      checks.push({
        name: 'OGPタグ',
        status: 'good',
        description: 'すべての必要なOGPタグが設定されています'
      });
      score += 100;
    } else if (ogCount > 0) {
      checks.push({
        name: 'OGPタグ',
        status: 'warning',
        description: `一部のOGPタグが不足 (${ogCount}/4)`,
        improvement: {
          title: 'OGPタグの完全実装',
          description: 'SNSでのシェア時の表示を最適化',
          implementation: 'openGraph設定をMetadataに追加',
          impact: 10
        }
      });
      score += 25 * ogCount;
    } else {
      checks.push({
        name: 'OGPタグ',
        status: 'error',
        description: 'OGPタグが設定されていません',
        improvement: {
          title: 'OGPタグの実装',
          description: 'SNSでのクリック率向上に必要',
          implementation: 'openGraph設定をMetadataに追加',
          impact: 18
        }
      });
    }

    return {
      score: Math.round(score / totalChecks),
      checks
    };
  }

  private analyzePerformance($: any, headers: Record<string, string>): SEOCategoryResult {
    const checks: SEOCheckResult[] = [];
    let score = 0;
    let totalChecks = 0;

    // 画像最適化チェック
    totalChecks++;
    const images = $('img');
    const imagesWithoutAlt = $('img:not([alt])');
    const totalImages = images.length;
    const missingAlt = imagesWithoutAlt.length;

    if (totalImages === 0) {
      checks.push({
        name: '画像最適化',
        status: 'good',
        description: '画像が見つかりません'
      });
      score += 100;
    } else if (missingAlt === 0) {
      checks.push({
        name: '画像最適化',
        status: 'good',
        description: 'すべての画像にalt属性が設定されています'
      });
      score += 100;
    } else {
      const percentage = Math.round((missingAlt / totalImages) * 100);
      checks.push({
        name: '画像最適化',
        status: percentage > 30 ? 'error' : 'warning',
        description: `${missingAlt}個の画像にalt属性がありません (${percentage}%)`,
        improvement: {
          title: '画像alt属性の追加',
          description: 'アクセシビリティとSEOの向上',
          implementation: 'Next.js Imageコンポーネントを使用',
          impact: 15
        }
      });
      score += percentage > 30 ? 30 : 70;
    }

    // レスポンシブデザインチェック
    totalChecks++;
    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (hasViewport) {
      checks.push({
        name: 'レスポンシブデザイン',
        status: 'good',
        description: 'ビューポート設定が適切です'
      });
      score += 100;
    } else {
      checks.push({
        name: 'レスポンシブデザイン',
        status: 'error',
        description: 'ビューポート設定がありません',
        improvement: {
          title: 'ビューポート設定の追加',
          description: 'モバイルフレンドリー対応',
          implementation: 'viewport metaタグを追加',
          impact: 18
        }
      });
    }

    return {
      score: Math.round(score / totalChecks),
      checks
    };
  }

  private analyzeStructuredData($: any): SEOCategoryResult {
    const checks: SEOCheckResult[] = [];
    let score = 0;
    const totalChecks = 1;

    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      let validJsonLd = true;
      const schemaTypes: string[] = [];

      jsonLdScripts.each((_: any, script: any) => {
        try {
          const content = $(script).html();
          if (content) {
            const jsonData = JSON.parse(content);
            if (jsonData['@type']) {
              schemaTypes.push(jsonData['@type']);
            }
          }
        } catch (error) {
          validJsonLd = false;
        }
      });

      if (validJsonLd && schemaTypes.length > 0) {
        checks.push({
          name: '構造化データ',
          status: 'good',
          description: `構造化データが実装されています (${schemaTypes.join(', ')})`
        });
        score += 100;
      } else if (validJsonLd) {
        checks.push({
          name: '構造化データ',
          status: 'warning',
          description: 'JSON-LDは存在しますが、基本的なschemaが不足',
          improvement: {
            title: '構造化データの改善',
            description: 'Organization、WebSiteなどの基本schemaを追加',
            implementation: 'JSON-LD形式でschema.orgマークアップを追加',
            impact: 15
          }
        });
        score += 50;
      } else {
        checks.push({
          name: '構造化データ',
          status: 'warning',
          description: 'JSON-LDの形式が無効です',
          improvement: {
            title: 'JSON-LD形式の修正',
            description: '有効なJSON-LD構造化データを実装',
            implementation: 'schema.org仕様に準拠したJSON-LDを作成',
            impact: 15
          }
        });
        score += 20;
      }
    } else {
      checks.push({
        name: '構造化データ',
        status: 'error',
        description: '構造化データが見つかりません',
        improvement: {
          title: '構造化データの実装',
          description: 'リッチスニペット表示のために構造化データを追加',
          implementation: 'JSON-LD形式でschema.orgマークアップを追加',
          impact: 20
        }
      });
    }

    return {
      score: Math.round(score / totalChecks),
      checks
    };
  }

  private analyzeTechnical($: any, url: string): SEOCategoryResult {
    const checks: SEOCheckResult[] = [];
    let score = 0;
    let totalChecks = 0;

    // Canonical URLチェック
    totalChecks++;
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      checks.push({
        name: 'Canonical URL',
        status: 'good',
        description: 'Canonical URLが設定されています'
      });
      score += 100;
    } else {
      checks.push({
        name: 'Canonical URL',
        status: 'warning',
        description: 'Canonical URLが設定されていません',
        improvement: {
          title: 'Canonical URLの設定',
          description: '重複コンテンツ問題の防止',
          implementation: 'Next.js MetadataでcanonicalURLを設定',
          impact: 12
        }
      });
    }

    // 言語設定チェック
    totalChecks++;
    const hasLang = $('html[lang]').length > 0;
    if (hasLang) {
      checks.push({
        name: 'HTML言語属性',
        status: 'good',
        description: 'HTML言語属性が設定されています'
      });
      score += 100;
    } else {
      checks.push({
        name: 'HTML言語属性',
        status: 'warning',
        description: 'HTML言語属性が設定されていません',
        improvement: {
          title: 'HTML言語属性の設定',
          description: 'アクセシビリティとSEOの向上',
          implementation: 'html要素にlang属性を追加',
          impact: 8
        }
      });
    }

    return {
      score: Math.round(score / totalChecks),
      checks
    };
  }

  private calculateOverallScore(categories: SEOAnalysisResult['categories']): number {
    const scores = Object.values(categories).map(cat => cat.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private extractTopIssues(categories: SEOAnalysisResult['categories']): SEOAnalysisResult['topIssues'] {
    const issues: SEOAnalysisResult['topIssues'] = [];
    
    Object.entries(categories).forEach(([categoryName, category]) => {
      category.checks.forEach(check => {
        if (check.status === 'error') {
          issues.push({
            message: check.description,
            severity: 'high',
            category: categoryName
          });
        } else if (check.status === 'warning' && check.improvement) {
          issues.push({
            message: check.description,
            severity: check.improvement.impact > 15 ? 'high' : 'medium',
            category: categoryName
          });
        }
      });
    });

    return issues.slice(0, 5); // Top 5 issues
  }

  private generateRecommendations(categories: SEOAnalysisResult['categories']): SEOAnalysisResult['recommendations'] {
    const recommendations: SEOAnalysisResult['recommendations'] = [];
    
    Object.values(categories).forEach(category => {
      category.checks.forEach(check => {
        if (check.improvement) {
          recommendations.push({
            title: check.improvement.title,
            description: check.improvement.description,
            impact: check.improvement.impact,
            effort: check.improvement.impact > 15 ? 'high' : check.improvement.impact > 10 ? 'medium' : 'low'
          });
        }
      });
    });

    return recommendations
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 8); // Top 8 recommendations
  }
}

export const seoAnalysisService = new SEOAnalysisService();