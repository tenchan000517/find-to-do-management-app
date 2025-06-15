#!/bin/bash

echo "🧪 Phase 6 Advanced Automation - API Testing Script"
echo "=================================================="

BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing Project Promotion Candidates API..."
echo "GET /api/projects/promotion-candidates"
curl -s "$BASE_URL/api/projects/promotion-candidates" | jq '.summary' 2>/dev/null || echo "❌ API not available or server not running"

echo ""
echo "2. Testing Project Promotion Candidates with filters..."
echo "GET /api/projects/promotion-candidates?minConfidence=0.8&autoPromotionOnly=true"
curl -s "$BASE_URL/api/projects/promotion-candidates?minConfidence=0.8&autoPromotionOnly=true" | jq '.summary' 2>/dev/null || echo "❌ API not available or server not running"

echo ""
echo "3. Testing Auto-promotion evaluation..."
echo "POST /api/projects/promotion-candidates (auto_promote_all)"
curl -s -X POST "$BASE_URL/api/projects/promotion-candidates" \
  -H "Content-Type: application/json" \
  -d '{"action":"auto_promote_all"}' | jq '.summary' 2>/dev/null || echo "❌ API not available or server not running"

echo ""
echo "4. Testing KGI Generation..."
echo "GET /api/projects/[PROJECT_ID]/kgi"
echo "Note: Replace [PROJECT_ID] with actual project ID from your database"

echo ""
echo "5. Testing KGI Auto-setting..."
echo "PUT /api/projects/[PROJECT_ID]/kgi"
echo "Note: Replace [PROJECT_ID] with actual project ID from your database"

echo ""
echo "6. Testing Enhanced LINE Command Detection..."
echo "This feature integrates with the existing LINE webhook at /api/webhook/line"

echo ""
echo "📋 Manual Testing Checklist:"
echo "=========================="
echo "□ Start development server: npm run dev"
echo "□ Test promotion candidates detection with existing data"
echo "□ Test auto-promotion for high-confidence candidates"
echo "□ Test KGI generation for projects without KGI"
echo "□ Test KGI auto-setting for projects with sufficient confidence"
echo "□ Test enhanced LINE intent recognition with natural language"
echo "□ Verify all 4 detection types work: task clusters, appointments, connections, LINE inputs"
echo "□ Verify 5 business outcome types work: sales, partnership, product, internal, marketing"
echo "□ Check performance impact on existing functionality"

echo ""
echo "🎯 Expected Results:"
echo "=================="
echo "• Promotion candidates API returns structured candidate data"
echo "• Auto-promotion creates projects for high-confidence candidates"
echo "• KGI generation provides business-relevant goals"
echo "• KGI auto-setting works for projects with >70% confidence"
echo "• Enhanced LINE detection recognizes natural language patterns"
echo "• No breaking changes to existing functionality"

echo ""
echo "🔍 Debug Commands:"
echo "================="
echo "# Check API response structure"
echo "curl -s \"$BASE_URL/api/projects/promotion-candidates\" | jq"
echo ""
echo "# Check KGI generation for specific project"
echo "curl -s \"$BASE_URL/api/projects/1/kgi\" | jq"
echo ""
echo "# Auto-set KGI for specific project"
echo "curl -s -X PUT \"$BASE_URL/api/projects/1/kgi\" -H \"Content-Type: application/json\" -d '{\"action\":\"auto_set\"}' | jq"