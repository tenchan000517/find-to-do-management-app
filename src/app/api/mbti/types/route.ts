// Phase 1: MBTI Types Information API
// Implementation Date: 2025-06-27
// Description: API endpoint for MBTI type information and validation

import { NextRequest, NextResponse } from 'next/server';
import mbtiData from '../../../../../public/data/mbti.json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const includeCompatibility = searchParams.get('includeCompatibility') === 'true';
    
    if (type) {
      // Get specific MBTI type information
      const mbtiType = type.toUpperCase();
      
      if (!/^[A-Z]{4}$/.test(mbtiType)) {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid MBTI type format. Must be 4 uppercase letters.',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      const typeData = (mbtiData.mbti_types as any)[mbtiType];
      if (!typeData) {
        return NextResponse.json({
          success: false,
          error: 'NOT_FOUND',
          message: `MBTI type ${mbtiType} not found`,
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      let response: any = {
        type: mbtiType,
        data: typeData
      };

      if (includeCompatibility) {
        response.compatibility = (mbtiData.compatibility_matrix as any)[mbtiType] || {};
      }

      return NextResponse.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });
    }

    if (category) {
      // Get MBTI types by category
      const categoryTypes = Object.entries(mbtiData.mbti_types as any)
        .filter(([_, data]: [string, any]) => data.category.toLowerCase() === category.toLowerCase())
        .reduce((acc, [type, data]) => {
          acc[type] = data;
          return acc;
        }, {} as Record<string, any>);

      if (Object.keys(categoryTypes).length === 0) {
        return NextResponse.json({
          success: false,
          error: 'NOT_FOUND',
          message: `No MBTI types found for category: ${category}`,
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          category,
          types: categoryTypes,
          count: Object.keys(categoryTypes).length
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get all MBTI types with summary
    const typesSummary = Object.entries(mbtiData.mbti_types as any).map(([type, data]: [string, any]) => ({
      type,
      name: data.name,
      category: data.category,
      population_percentage: data.population_percentage,
      optimal_roles: data.optimal_roles.slice(0, 3), // First 3 roles
      strengths: data.strengths.slice(0, 3), // First 3 strengths
      core_leadership: data.core_traits.leadership,
      core_innovation: data.core_traits.innovation,
      core_collaboration: data.core_traits.team_collaboration
    }));

    const categories = Array.from(new Set(typesSummary.map(t => t.category)));
    
    return NextResponse.json({
      success: true,
      data: {
        types: typesSummary,
        categories,
        totalTypes: typesSummary.length,
        metadata: {
          task_weight_factors: mbtiData.task_weight_factors,
          project_success_factors: mbtiData.project_success_factors
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching MBTI types:', error);
    return NextResponse.json({
      success: false,
      error: 'FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch MBTI types',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { types, operation } = body;
    
    if (!Array.isArray(types) || types.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'types array is required and must not be empty',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate all MBTI types
    const invalidTypes = types.filter(type => !/^[A-Z]{4}$/.test(type));
    if (invalidTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Invalid MBTI types: ${invalidTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const unknownTypes = types.filter(type => !(mbtiData.mbti_types as any)[type]);
    if (unknownTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Unknown MBTI types: ${unknownTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    switch (operation) {
      case 'validate':
        return NextResponse.json({
          success: true,
          data: {
            types,
            valid: true,
            validationDate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      case 'compare':
        if (types.length < 2) {
          return NextResponse.json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'At least 2 types required for comparison',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }

        const comparison = types.map(type => {
          const data = (mbtiData.mbti_types as any)[type];
          return {
            type,
            name: data.name,
            category: data.category,
            dimensions: data.dimensions,
            core_traits: data.core_traits,
            task_preferences: data.task_preferences,
            optimal_roles: data.optimal_roles,
            strengths: data.strengths,
            weaknesses: data.weaknesses
          };
        });

        // Calculate dimension differences
        const dimensionComparison = {
          extraversion: comparison.map(c => ({ type: c.type, value: c.dimensions.extraversion })),
          sensing: comparison.map(c => ({ type: c.type, value: c.dimensions.sensing })),
          thinking: comparison.map(c => ({ type: c.type, value: c.dimensions.thinking })),
          judging: comparison.map(c => ({ type: c.type, value: c.dimensions.judging }))
        };

        return NextResponse.json({
          success: true,
          data: {
            types,
            comparison,
            dimensionComparison,
            comparisonDate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      case 'compatibility_matrix':
        const matrix: Record<string, Record<string, number>> = {};
        
        types.forEach(type1 => {
          matrix[type1] = {};
          types.forEach(type2 => {
            if (type1 !== type2) {
              matrix[type1][type2] = (mbtiData.compatibility_matrix as any)[type1]?.[type2] || 5;
            }
          });
        });

        return NextResponse.json({
          success: true,
          data: {
            types,
            compatibilityMatrix: matrix,
            matrixDate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid operation. Supported operations: validate, compare, compatibility_matrix',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing MBTI types operation:', error);
    return NextResponse.json({
      success: false,
      error: 'OPERATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to process MBTI types operation',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}