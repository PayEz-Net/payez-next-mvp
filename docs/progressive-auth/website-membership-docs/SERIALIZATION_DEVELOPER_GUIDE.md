# Enterprise Serialization Framework - Developer Guide

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Performance Optimization](#performance-optimization)
- [Testing Guidelines](#testing-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

This enterprise-grade serialization framework provides:

- **Type Safety**: Full TypeScript integration with runtime validation
- **Automatic Validation**: Declarative validation with decorators
- **Performance**: Caching, optimized serialization, metrics tracking
- **Flexibility**: Multiple input/output formats, transformation pipeline
- **Security**: Business rule validation, security scoring
- **Maintainability**: Single source of truth, consistent patterns

## Quick Start

### 1. Create a New Model

```typescript
import { ApiModel } from '@/lib/serialization/base';
import { Property, Required, Email, Transform, Transformers } from '@/lib/serialization/decorators';

interface ProductData {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  tags: string[];
}

export class ProductModel extends ApiModel<ProductData> {
  @Property({ required: true, type: 'number' })
  @Required
  id: number = 0;

  @Property({ required: true, type: 'string' })
  @Required
  name: string = '';

  @Property({ type: 'number', transform: Transformers.number })
  @Transform(Transformers.number)
  price: number = 0;

  @Property({ type: 'boolean', transform: Transformers.boolean })
  @Transform(Transformers.boolean)
  isActive: boolean = true;

  @Property({ type: 'array', transform: Transformers.commaArray })
  @Transform(Transformers.commaArray)
  tags: string[] = [];

  // Computed properties
  get isExpensive(): boolean {
    return this.price > 100;
  }
}
```

### 2. Handle API Responses

```typescript
import { ApiResponseSerializer } from '@/lib/serializers/api-response-serializer';

// Handle any API response format
const response = await clientApi.post('/api/products', request, token);
const result = ApiResponseSerializer.handleResponse(response, ProductModel);

// Access validated, typed data
const products = result.items; // ProductModel[]
const pagination = {
  total: result.totalItems,
  page: result.pageNumber,
  pageSize: result.pageSize
};

// Check validation
if (!result.validation.isValid) {
  console.warn('Data quality issues:', result.validation.warnings);
}
```

### 3. Create from Different Formats

```typescript
// From API format (snake_case)
const product = ProductModel.fromApiFormat({
  id: 1,
  name: 'Widget',
  price: '29.99',
  is_active: 'true',
  tags: 'electronics,gadget'
});

// From camelCase format
const product2 = ProductModel.fromCamelCase({
  id: 1,
  name: 'Widget',
  price: 29.99,
  isActive: true,
  tags: ['electronics', 'gadget']
});

// Validate
const validation = product.validate();
if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);
}
```

## Architecture

### Core Components

```
📁 src/lib/serialization/
├── 📄 base.ts                    # Base classes (SerializableModel, ApiModel)
├── 📄 decorators.ts             # Validation & transformation decorators
└── 📄 api-response-serializer.ts # Universal response handler

📁 src/models/
├── 📁 user/
│   └── 📄 UserModel.ts          # Enhanced user model
├── 📁 enhanced/
│   ├── 📄 SessionModel.ts       # Enhanced session model
│   └── 📄 IDPClient.ts          # Enhanced IDP client model
└── 📁 legacy/                   # Original models (for reference)
```

### Class Hierarchy

```
SerializableModel (abstract)
└── ValidatedModel (abstract)
    └── ApiModel<T> (abstract)
        ├── UserModel
        ├── SessionModel
        └── IDPClient
```

## Core Concepts

### 1. Base Classes

#### SerializableModel
- **Purpose**: Basic serialization/deserialization
- **Features**: JSON conversion, object cloning, equality
- **Use**: Foundation for all data models

#### ValidatedModel
- **Purpose**: Adds validation capabilities
- **Features**: Decorator-based validation, error aggregation
- **Use**: Models requiring data validation

#### ApiModel\<T>
- **Purpose**: API-specific serialization
- **Features**: Case conversion, API format handling, transformation
- **Use**: Models communicating with APIs

### 2. Decorators

#### Property Decorators
```typescript
@Property({ 
  required: boolean,           // Is this property required?
  type: string,               // Property type for validation
  transform: TransformFunction, // Transformation function
  apiName: string             // API property name (snake_case)
})
```

#### Validation Decorators
```typescript
@Required                    // Property must have value
@Email                      // Valid email format
@NumberRange(min, max)      // Number within range
@ArrayValidator(itemValidator) // Validate array items
@Validator(customFunction)  // Custom validation logic
```

#### Transformation Decorators
```typescript
@Transform(Transformers.number)     // String ↔ Number
@Transform(Transformers.boolean)    // String ↔ Boolean
@Transform(Transformers.date)       // String ↔ Date
@Transform(Transformers.commaArray) // String ↔ Array
```

### 3. Response Serializer

```typescript
interface SerializedResponse<T> {
  items: T[];                // Validated, typed items
  totalItems: number;        // Total count
  pageNumber: number;        // Current page
  pageSize: number;          // Items per page
  metadata: object;          // Additional response data
  validation: {              // Validation results
    isValid: boolean;
    errors: string[];
    warnings: string[];
    itemValidations: ValidationResult[];
  };
  performance: {             // Performance metrics
    normalizationTime: number;
    deserializationTime: number;
    validationTime: number;
    totalTime: number;
    cacheHit: boolean;
  };
}
```

## Best Practices

### 1. Model Design

#### ✅ Do:
```typescript
export class ProductModel extends ApiModel<ProductData> {
  @Property({ required: true, type: 'string' })
  @Required
  @Validator(customBusinessRule)
  name: string = '';

  // Computed properties for business logic
  get isExpensive(): boolean {
    return this.price > 100;
  }

  // Business methods
  applyDiscount(percentage: number): ProductModel {
    return this.clone({ price: this.price * (1 - percentage / 100) });
  }
}
```

#### ❌ Don't:
```typescript
export class ProductModel extends ApiModel<ProductData> {
  name: string; // No default value
  // No validation decorators
  // No computed properties
  // Mutation methods instead of immutable operations
}
```

### 2. Validation Rules

#### ✅ Do:
```typescript
@Validator((value: any) => {
  if (typeof value !== 'string' || value.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
    return { isValid: false, message: 'Name contains invalid characters' };
  }
  return { isValid: true };
})
name: string = '';
```

#### ❌ Don't:
```typescript
@Validator((value: any) => {
  // Overly permissive
  return { isValid: true };
})
// Or overly restrictive without clear business justification
@Validator((value: any) => {
  if (value !== 'EXACT_VALUE') return { isValid: false, message: 'Must be exact' };
  return { isValid: true };
})
```

### 3. Error Handling

#### ✅ Do:
```typescript
const result = ApiResponseSerializer.handleResponse(response, ProductModel);

if (!result.validation.isValid) {
  // Log validation issues for monitoring
  console.warn('Data quality issues detected:', {
    errors: result.validation.errors,
    warnings: result.validation.warnings,
    itemCount: result.items.length
  });
  
  // Continue with valid items or handle gracefully
  const validItems = result.items.filter(item => item.validate().isValid);
}
```

#### ❌ Don't:
```typescript
try {
  const result = ApiResponseSerializer.handleResponse(response, ProductModel, {
    throwOnValidationError: true // Throws on any validation issue
  });
} catch (error) {
  // Swallow all errors silently
  return [];
}
```

### 4. Performance Optimization

#### ✅ Do:
```typescript
// Use caching for frequently accessed data
const result = ApiResponseSerializer.handleResponse(response, ProductModel, {
  useCache: true
});

// Monitor performance
if (result.performance.totalTime > 100) {
  console.warn('Slow serialization detected:', result.performance);
}

// Clear cache when appropriate
if (isDataStale) {
  ApiResponseSerializer.clearCache();
}
```

#### ❌ Don't:
```typescript
// Disable caching unnecessarily
const result = ApiResponseSerializer.handleResponse(response, ProductModel, {
  useCache: false // Only disable when data freshness is critical
});

// Ignore performance metrics
// No monitoring of serialization performance
```

## Advanced Usage

### 1. Custom Transformers

```typescript
const Transformers = {
  // Custom currency transformer
  currency: {
    serialize: (value: number) => `$${value.toFixed(2)}`,
    deserialize: (value: string) => parseFloat(value.replace('$', ''))
  },

  // Custom enum transformer
  status: {
    serialize: (value: ProductStatus) => value.toString(),
    deserialize: (value: string) => ProductStatus[value as keyof typeof ProductStatus]
  }
};

export class ProductModel extends ApiModel<ProductData> {
  @Property({ type: 'number', transform: Transformers.currency })
  @Transform(Transformers.currency)
  price: number = 0;

  @Property({ type: 'string', transform: Transformers.status })
  @Transform(Transformers.status)
  status: ProductStatus = ProductStatus.Active;
}
```

### 2. Complex Validation

```typescript
export class OrderModel extends ApiModel<OrderData> {
  @Property({ required: true, type: 'array' })
  @ArrayValidator((item: any) => {
    if (!item.productId || !item.quantity) {
      return { isValid: false, message: 'Order items must have productId and quantity' };
    }
    if (item.quantity <= 0) {
      return { isValid: false, message: 'Quantity must be positive' };
    }
    return { isValid: true };
  })
  items: OrderItem[] = [];

  // Complex business validation
  validate() {
    const result = super.validate();
    const errors = [...result.errors];
    const warnings = [...result.warnings];

    // Business rule: minimum order value
    if (this.getTotalValue() < 10) {
      errors.push('Order total must be at least $10');
    }

    // Business rule: maximum items
    if (this.items.length > 50) {
      warnings.push('Large orders may require special handling');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  getTotalValue(): number {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}
```

### 3. Nested Models

```typescript
export class UserProfileModel extends ApiModel<UserProfileData> {
  @Property({ required: true, type: 'object' })
  @Required
  @Validator((value: any) => {
    if (!(value instanceof AddressModel)) {
      return { isValid: false, message: 'Address must be AddressModel instance' };
    }
    return value.validate();
  })
  address: AddressModel = new AddressModel();

  @Property({ type: 'array' })
  @ArrayValidator((item: any) => {
    if (!(item instanceof ContactModel)) {
      return { isValid: false, message: 'Contacts must be ContactModel instances' };
    }
    return item.validate();
  })
  contacts: ContactModel[] = [];

  static fromApiFormat(data: any): UserProfileModel {
    const profile = super.fromApiFormat(data) as UserProfileModel;
    
    // Handle nested models
    if (data.address) {
      profile.address = AddressModel.fromApiFormat(data.address);
    }
    
    if (data.contacts) {
      profile.contacts = data.contacts.map((contact: any) => 
        ContactModel.fromApiFormat(contact)
      );
    }
    
    return profile;
  }
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Short-lived cache for frequently accessed data
const userResult = ApiResponseSerializer.handleResponse(response, UserModel, {
  useCache: true // 30s TTL by default
});

// Disable cache for real-time data
const realtimeResult = ApiResponseSerializer.handleResponse(response, OrderModel, {
  useCache: false
});

// Monitor cache performance
const stats = ApiResponseSerializer.getCacheStats();
console.log(`Cache hit rate: ${stats.size}/${stats.maxSize}, entries: ${stats.entries.length}`);
```

### 2. Validation Optimization

```typescript
// Skip validation for trusted internal APIs
const result = ApiResponseSerializer.handleResponse(response, ProductModel, {
  throwOnValidationError: false // Handle errors gracefully
});

// Batch validation for large datasets
const products = ProductModel.fromApiFormatArray(largeDataset);
const validationResults = products.map(p => p.validate());
const validProducts = products.filter((_, i) => validationResults[i].isValid);
```

### 3. Memory Management

```typescript
// Clear cache periodically
setInterval(() => {
  ApiResponseSerializer.clearCache();
}, 5 * 60 * 1000); // Every 5 minutes

// Use lightweight models for large datasets
export class ProductSummaryModel extends SerializableModel {
  // Only essential properties for lists
  @Property({ required: true, type: 'number' })
  id: number = 0;
  
  @Property({ required: true, type: 'string' })
  name: string = '';
}
```

## Testing Guidelines

### 1. Unit Testing Models

```typescript
import { ProductModel } from '@/models/ProductModel';

describe('ProductModel', () => {
  it('should validate required fields', () => {
    const product = new ProductModel();
    const validation = product.validate();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('id is required');
    expect(validation.errors).toContain('name is required');
  });

  it('should transform API data correctly', () => {
    const apiData = {
      id: 1,
      name: 'Widget',
      price: '29.99',
      is_active: 'true',
      tags: 'electronics,gadget'
    };

    const product = ProductModel.fromApiFormat(apiData);
    
    expect(product.id).toBe(1);
    expect(product.price).toBe(29.99);
    expect(product.isActive).toBe(true);
    expect(product.tags).toEqual(['electronics', 'gadget']);
  });

  it('should compute properties correctly', () => {
    const product = ProductModel.fromCamelCase({
      id: 1,
      name: 'Expensive Widget',
      price: 150,
      isActive: true,
      tags: []
    });

    expect(product.isExpensive).toBe(true);
  });
});
```

### 2. Integration Testing

```typescript
import { ApiResponseSerializer } from '@/lib/serializers/api-response-serializer';

describe('API Response Serialization', () => {
  it('should handle different response formats', () => {
    const testCases = [
      // Direct array
      { data: [{ id: 1, name: 'Test' }] },
      // Nested pagination
      { data: { data: [{ id: 1, name: 'Test' }], totalItems: 1 } },
      // Items format
      { data: { items: [{ id: 1, name: 'Test' }], total: 1 } }
    ];

    testCases.forEach((response, index) => {
      const result = ApiResponseSerializer.handleResponse(response, ProductModel);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(ProductModel);
    });
  });

  it('should cache responses appropriately', () => {
    const response = { data: [{ id: 1, name: 'Test' }] };
    
    // First call
    const result1 = ApiResponseSerializer.handleResponse(response, ProductModel);
    expect(result1.performance.cacheHit).toBe(false);
    
    // Second call (should be cached)
    const result2 = ApiResponseSerializer.handleResponse(response, ProductModel);
    expect(result2.performance.cacheHit).toBe(true);
  });
});
```

### 3. Performance Testing

```typescript
describe('Serialization Performance', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 100,
      is_active: Math.random() > 0.5,
      tags: `tag${i},category${i % 10}`
    }));

    const response = { data: largeDataset };
    const startTime = performance.now();
    
    const result = ApiResponseSerializer.handleResponse(response, ProductModel);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    expect(result.items).toHaveLength(1000);
    expect(result.validation.isValid).toBe(true);
  });
});
```

## Coding Standards

### 1. Model Structure

```typescript
/**
 * Model documentation with:
 * - Purpose and business context
 * - Key features and capabilities
 * - Usage examples
 * - Security considerations (if applicable)
 */
export class ModelName extends ApiModel<ModelData> {
  protected static readonly MODEL_NAME = 'ModelName';

  // 1. Required properties first, with validation
  @Property({ required: true, type: 'string' })
  @Required
  requiredField: string = '';

  // 2. Optional properties, grouped logically
  @Property({ type: 'number', transform: Transformers.number })
  @Transform(Transformers.number)
  numericField: number = 0;

  // 3. Computed properties (read-only)
  get computedProperty(): string {
    return `${this.requiredField}-computed`;
  }

  // 4. Business logic methods
  businessMethod(): boolean {
    // Business logic here
    return true;
  }

  // 5. Validation override (if needed)
  validate() {
    const result = super.validate();
    // Additional business validation
    return result;
  }

  // 6. Conversion methods
  toSpecialFormat(): SpecialFormat {
    // Conversion logic
  }
}
```

### 2. Validation Rules

```typescript
// Prefer specific, business-meaningful validation
@Validator((value: any) => {
  if (!value || value.length < 3) {
    return { 
      isValid: false, 
      message: 'Product name must be at least 3 characters for search optimization' 
    };
  }
  return { isValid: true };
})

// Include business context in error messages
@Validator((value: any) => {
  if (value < 0) {
    return { 
      isValid: false, 
      message: 'Price cannot be negative (business rule: no negative pricing)' 
    };
  }
  return { isValid: true };
})
```

### 3. Error Handling

```typescript
// Handle validation gracefully
const result = ApiResponseSerializer.handleResponse(response, ProductModel);

if (!result.validation.isValid) {
  // Log for monitoring
  logger.warn('Data quality issues detected', {
    model: 'ProductModel',
    errorCount: result.validation.errors.length,
    warningCount: result.validation.warnings.length,
    endpoint: '/api/products'
  });

  // Notify user appropriately
  showNotification({
    type: 'warning',
    message: 'Some data may be incomplete. Please review before proceeding.',
    details: result.validation.warnings
  });
}
```

### 4. Documentation

```typescript
/**
 * Product model for e-commerce catalog
 * 
 * @example
 * ```typescript
 * // Create from API
 * const product = ProductModel.fromApiFormat(apiData);
 * 
 * // Validate
 * const validation = product.validate();
 * if (validation.isValid) {
 *   // Use product
 * }
 * 
 * // Apply business logic
 * const discountedProduct = product.applyDiscount(10);
 * ```
 * 
 * @security This model contains pricing information - validate carefully
 * @performance Large catalogs should use ProductSummaryModel for lists
 */
export class ProductModel extends ApiModel<ProductData> {
  // Implementation
}
```

## Troubleshooting

### Common Issues

#### 1. Validation Failures

**Issue**: Model validation fails unexpectedly
```typescript
const validation = model.validate();
console.log('Validation details:', validation);
```

**Solutions**:
- Check decorator configuration
- Verify default values
- Review business rules
- Check data transformation

#### 2. Serialization Errors

**Issue**: API response format not recognized
```typescript
console.error('Response format issue:', {
  responseType: typeof response.data,
  keys: Object.keys(response.data || {}),
  sampleData: response.data
});
```

**Solutions**:
- Check API response format
- Verify response structure
- Add custom format detection
- Update normalization logic

#### 3. Performance Issues

**Issue**: Slow serialization performance
```typescript
const stats = ApiResponseSerializer.getCacheStats();
console.log('Cache performance:', stats);

// Check individual model performance
const result = ApiResponseSerializer.handleResponse(response, Model);
console.log('Performance metrics:', result.performance);
```

**Solutions**:
- Enable caching
- Optimize validation rules
- Use lightweight models for lists
- Batch operations

#### 4. Type Conflicts

**Issue**: TypeScript compilation errors
**Solutions**:
- Ensure proper inheritance hierarchy
- Check decorator imports
- Verify interface definitions
- Update type definitions

### Debug Tools

```typescript
// Enable detailed logging
const result = ApiResponseSerializer.handleResponse(response, Model, {
  useCache: false // See full processing
});

// Model debugging
console.log('Model state:', model.toString());
console.log('Validation details:', model.validate());
console.log('Serialized data:', model.toApiFormat());

// Cache debugging
console.log('Cache stats:', ApiResponseSerializer.getCacheStats());
ApiResponseSerializer.clearCache(); // Reset if needed
```

## Migration Checklist

- [ ] **Import Updates**: Updated all model imports to enhanced versions
- [ ] **Validation Integration**: Added proper validation error handling
- [ ] **Testing**: Updated unit tests for new validation rules
- [ ] **Performance Monitoring**: Added performance tracking
- [ ] **Error Handling**: Implemented graceful error handling
- [ ] **Documentation**: Updated API documentation and examples
- [ ] **Rollback Plan**: Prepared rollback strategy if issues arise

## Support

For questions or issues with the serialization framework:

1. **Check Documentation**: Review this guide and migration docs
2. **Validation Debugging**: Use model validation methods
3. **Performance Analysis**: Check serializer performance metrics
4. **Create Issues**: Document problems with reproduction steps

---

This framework significantly improves code quality, type safety, and maintainability while providing enterprise-grade features for data handling.
