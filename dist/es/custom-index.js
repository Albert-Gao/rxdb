/**
 * For some RxStorage implementations,
 * we need to use our custom crafted indexes
 * so we can easily iterate over them. And sort plain arrays of document data.
 */
import { getSchemaByObjectPath } from './rx-schema-helper';
import objectPath from 'object-path';
import { ensureNotFalsy } from './util';
/**
 * Crafts an indexable string that can be used
 * to check if a document would be sorted below or above 
 * another documents, dependent on the index values.
 */

export function getIndexableString(schema, index, docData) {
  var str = '';
  index.forEach(function (fieldName) {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    var fieldValue = objectPath.get(docData, fieldName);
    var type = schemaPart.type;

    switch (type) {
      case 'string':
        var maxLength = schemaPart.maxLength;

        if (!fieldValue) {
          fieldValue = '';
        }

        str += fieldValue.padStart(maxLength, ' ');
        break;

      case 'boolean':
        var boolToStr = fieldValue ? '1' : '0';
        str += boolToStr;
        break;

      case 'number':
      case 'integer':
        var parsedLengths = getStringLengthOfIndexNumber(schemaPart);

        if (!fieldValue) {
          fieldValue = 0;
        }

        str += getNumberIndexString(parsedLengths, fieldValue);
        break;

      default:
        throw new Error('unknown index type ' + type);
    }
  });
  return str;
}
export function getStringLengthOfIndexNumber(schemaPart) {
  var minimum = Math.floor(schemaPart.minimum);
  var maximum = Math.ceil(schemaPart.maximum);
  var multipleOf = schemaPart.multipleOf;
  var valueSpan = maximum - minimum;
  var nonDecimals = valueSpan.toString().length;
  var multipleOfParts = multipleOf.toString().split('.');
  var decimals = 0;

  if (multipleOfParts.length > 1) {
    decimals = multipleOfParts[1].length;
  }

  return {
    nonDecimals: nonDecimals,
    decimals: decimals,
    roundedMinimum: minimum
  };
}
export function getNumberIndexString(parsedLengths, fieldValue) {
  var str = '';
  var nonDecimalsValueAsString = (Math.floor(fieldValue) - parsedLengths.roundedMinimum).toString();
  str += nonDecimalsValueAsString.padStart(parsedLengths.nonDecimals, '0');
  var splittedByDecimalPoint = fieldValue.toString().split('.');
  var decimalValueAsString = splittedByDecimalPoint.length > 1 ? splittedByDecimalPoint[1] : '0';
  str += decimalValueAsString.padEnd(parsedLengths.decimals, '0');
  return str;
}
export function getStartIndexStringFromLowerBound(schema, index, lowerBound) {
  var str = '';
  index.forEach(function (fieldName, idx) {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    var bound = lowerBound[idx];
    var type = schemaPart.type;

    switch (type) {
      case 'string':
        var maxLength = ensureNotFalsy(schemaPart.maxLength);

        if (typeof bound === 'string') {
          str += bound.padStart(maxLength, ' ');
        } else {
          str += ''.padStart(maxLength, ' ');
        }

        break;

      case 'boolean':
        if (bound === null) {
          str += '0';
        } else {
          var boolToStr = bound ? '1' : '0';
          str += boolToStr;
        }

        break;

      case 'number':
      case 'integer':
        var parsedLengths = getStringLengthOfIndexNumber(schemaPart);

        if (bound === null) {
          str += '0'.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
        } else {
          str += getNumberIndexString(parsedLengths, bound);
        }

        break;

      default:
        throw new Error('unknown index type ' + type);
    }
  });
  return str;
}
export var MAX_CHAR = String.fromCharCode(65535);
export function getStartIndexStringFromUpperBound(schema, index, upperBound) {
  var str = '';
  index.forEach(function (fieldName, idx) {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    var bound = upperBound[idx];
    var type = schemaPart.type;

    switch (type) {
      case 'string':
        var maxLength = ensureNotFalsy(schemaPart.maxLength);

        if (typeof bound === 'string') {
          str += bound.padStart(maxLength, MAX_CHAR);
        } else {
          str += ''.padStart(maxLength, MAX_CHAR);
        }

        break;

      case 'boolean':
        if (bound === null) {
          str += '1';
        } else {
          var boolToStr = bound ? '1' : '0';
          str += boolToStr;
        }

        break;

      case 'number':
      case 'integer':
        var parsedLengths = getStringLengthOfIndexNumber(schemaPart);

        if (bound === null || bound === MAX_CHAR) {
          str += '9'.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
        } else {
          str += getNumberIndexString(parsedLengths, bound);
        }

        break;

      default:
        throw new Error('unknown index type ' + type);
    }
  });
  return str;
}
//# sourceMappingURL=custom-index.js.map