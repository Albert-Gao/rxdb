/**
 * For some RxStorage implementations,
 * we need to use our custom crafted indexes
 * so we can easily iterate over them. And sort plain arrays of document data.
 */

import { getSchemaByObjectPath } from './rx-schema-helper';
import { JsonSchema, RxDocumentData, RxJsonSchema } from './types';
import objectPath from 'object-path';
import { ensureNotFalsy } from './util';


/**
 * Crafts an indexable string that can be used
 * to check if a document would be sorted below or above 
 * another documents, dependent on the index values.
 */
export function getIndexableString<RxDocType>(
    schema: RxJsonSchema<RxDocumentData<RxDocType>>,
    index: string[],
    docData: RxDocumentData<RxDocType>
): string {
    let str = '';
    index.forEach(fieldName => {
        const schemaPart = getSchemaByObjectPath(
            schema,
            fieldName
        );
        let fieldValue = objectPath.get(docData, fieldName);
        const type = schemaPart.type;

        switch (type) {
            case 'string':
                const maxLength = schemaPart.maxLength as number;
                if (!fieldValue) {
                    fieldValue = '';
                }
                str += fieldValue.padStart(maxLength, ' ');
                break;
            case 'boolean':
                const boolToStr = fieldValue ? '1' : '0';
                str += boolToStr;
                break;
            case 'number':
            case 'integer':
                const parsedLengths = getStringLengthOfIndexNumber(
                    schemaPart
                );
                if (!fieldValue) {
                    fieldValue = 0;
                }
                str += getNumberIndexString(
                    parsedLengths,
                    fieldValue
                );
                break;
            default:
                throw new Error('unknown index type ' + type);
        }
    });
    return str;
}

declare type ParsedLengths = {
    nonDecimals: number;
    decimals: number;
    roundedMinimum: number;
};
export function getStringLengthOfIndexNumber(
    schemaPart: JsonSchema
): ParsedLengths {
    const minimum = Math.floor(schemaPart.minimum as number);
    const maximum = Math.ceil(schemaPart.maximum as number);
    const multipleOf: number = schemaPart.multipleOf as number;

    const valueSpan = maximum - minimum;
    const nonDecimals = valueSpan.toString().length;

    const multipleOfParts = multipleOf.toString().split('.');
    let decimals = 0;
    if (multipleOfParts.length > 1) {
        decimals = multipleOfParts[1].length;
    }
    return {
        nonDecimals,
        decimals,
        roundedMinimum: minimum
    };
}


export function getNumberIndexString(
    parsedLengths: ParsedLengths,
    fieldValue: number
): string {
    let str: string = '';
    const nonDecimalsValueAsString = (Math.floor(fieldValue) - parsedLengths.roundedMinimum).toString();
    str += nonDecimalsValueAsString.padStart(parsedLengths.nonDecimals, '0');

    const splittedByDecimalPoint = fieldValue.toString().split('.');
    const decimalValueAsString = splittedByDecimalPoint.length > 1 ? splittedByDecimalPoint[1] : '0';

    str += decimalValueAsString.padEnd(parsedLengths.decimals, '0');
    return str;
}

export function getStartIndexStringFromLowerBound(
    schema: RxJsonSchema<any>,
    index: string[],
    lowerBound: (string | boolean | number | null | undefined)[]
): string {
    let str = '';
    index.forEach((fieldName, idx) => {
        const schemaPart = getSchemaByObjectPath(
            schema,
            fieldName
        );
        const bound = lowerBound[idx];
        const type = schemaPart.type;

        switch (type) {
            case 'string':
                const maxLength = ensureNotFalsy(schemaPart.maxLength);
                if (typeof bound === 'string') {
                    str += (bound as string).padStart(maxLength, ' ');
                } else {
                    str += ''.padStart(maxLength, ' ');
                }
                break;
            case 'boolean':
                if (bound === null) {
                    str += '0';
                } else {
                    const boolToStr = bound ? '1' : '0';
                    str += boolToStr;
                }
                break;
            case 'number':
            case 'integer':
                const parsedLengths = getStringLengthOfIndexNumber(
                    schemaPart
                );
                if (bound === null) {
                    str += '0'.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
                } else {
                    str += getNumberIndexString(
                        parsedLengths,
                        bound as number
                    );
                }
                break;
            default:
                throw new Error('unknown index type ' + type);
        }
    });
    return str;
}

export const MAX_CHAR = String.fromCharCode(65535);

export function getStartIndexStringFromUpperBound(
    schema: RxJsonSchema<any>,
    index: string[],
    upperBound: (string | boolean | number | null | undefined)[]
): string {
    let str = '';

    index.forEach((fieldName, idx) => {
        const schemaPart = getSchemaByObjectPath(
            schema,
            fieldName
        );
        const bound = upperBound[idx];
        const type = schemaPart.type;

        switch (type) {
            case 'string':
                const maxLength = ensureNotFalsy(schemaPart.maxLength);
                if (typeof bound === 'string') {
                    str += (bound as string).padStart(maxLength, MAX_CHAR);
                } else {
                    str += ''.padStart(maxLength, MAX_CHAR);
                }
                break;
            case 'boolean':
                if (bound === null) {
                    str += '1';
                } else {
                    const boolToStr = bound ? '1' : '0';
                    str += boolToStr;
                }
                break;
            case 'number':
            case 'integer':
                const parsedLengths = getStringLengthOfIndexNumber(
                    schemaPart
                );
                if (bound === null || bound === MAX_CHAR) {
                    str += '9'.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
                } else {
                    str += getNumberIndexString(
                        parsedLengths,
                        bound as number
                    );
                }
                break;
            default:
                throw new Error('unknown index type ' + type);
        }
    });
    return str;
}
