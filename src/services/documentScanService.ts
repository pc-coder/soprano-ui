import Anthropic from '@anthropic-ai/sdk';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';
import { API_CONFIG } from '../config/api';

export interface DocumentData {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  panNumber?: string;
}

export type DocumentType = 'address' | 'pan';

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error: any) {
    console.error('[DocumentScan] Permission error:', error.message);
    return false;
  }
};

/**
 * Capture document image using camera or gallery
 */
export const captureDocument = async (useCamera: boolean = true): Promise<string | null> => {
  try {
    let result;

    if (useCamera) {
      // Request camera permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      // Launch camera
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });
    } else {
      // Launch image library
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });
    }

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error('[DocumentScan] Capture error:', error.message);
    throw new Error(`Failed to capture document: ${error.message}`);
  }
};

/**
 * Extract document data using Claude Vision API
 */
export const extractDocumentData = async (
  imageUri: string,
  documentType: DocumentType
): Promise<DocumentData> => {
  const startTime = performance.now();

  try {
    // Read image file as base64
    const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: EncodingType.Base64,
    });

    // Determine media type from URI
    const mediaType = imageUri.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    // Create Anthropic client
    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    // Prepare prompt based on document type
    const prompt = getPromptForDocumentType(documentType);

    // Call Claude Vision API
    const message = await anthropic.messages.create({
      model: API_CONFIG.anthropic.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract response text
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new Error('No response from Claude Vision API');
    }

    // Parse JSON response
    const extractedData = parseDocumentResponse(responseText, documentType);

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[DocumentScan] Extraction completed in ${duration}s`);
    console.log('[DocumentScan] Extracted data:', extractedData);

    return extractedData;
  } catch (error: any) {
    console.error('[DocumentScan] Extraction error:', error.message);
    throw new Error(`Failed to extract document data: ${error.message}`);
  }
};

/**
 * Get prompt based on document type
 */
const getPromptForDocumentType = (documentType: DocumentType): string => {
  if (documentType === 'address') {
    return `Analyze this Indian address document (Aadhaar card, utility bill, etc.) and extract the address details.
Return ONLY a JSON object (no markdown, no code blocks) with these fields:
{
  "addressLine1": "house/flat number and building name",
  "addressLine2": "street, area, locality",
  "city": "city name",
  "state": "Indian state name",
  "pincode": "6-digit Indian pincode"
}

Rules:
- Extract the complete Indian address from the document
- If any field is not found, use empty string ""
- Ensure pincode is exactly 6 digits (Indian postal code format)
- State should be an Indian state name (e.g., Maharashtra, Karnataka, Tamil Nadu)
- Return ONLY the JSON object, nothing else`;
  } else {
    return `Analyze this Indian PAN card and extract the PAN number.
Return ONLY a JSON object (no markdown, no code blocks) with this field:
{
  "panNumber": "10-character PAN number in format ABCDE1234F"
}

Rules:
- PAN (Permanent Account Number) is an Indian tax identifier
- PAN format is 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
- Return in uppercase
- If not found or invalid, use empty string ""
- Return ONLY the JSON object, nothing else`;
  }
};

/**
 * Parse Claude's response and extract structured data
 */
const parseDocumentResponse = (
  responseText: string,
  documentType: DocumentType
): DocumentData => {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse JSON
    const parsed = JSON.parse(cleanedText);

    // Validate and return based on document type
    if (documentType === 'address') {
      return {
        addressLine1: parsed.addressLine1 || '',
        addressLine2: parsed.addressLine2 || '',
        city: parsed.city || '',
        state: parsed.state || '',
        pincode: parsed.pincode || '',
      };
    } else {
      return {
        panNumber: parsed.panNumber || '',
      };
    }
  } catch (error: any) {
    console.error('[DocumentScan] Parse error:', error.message);
    console.error('[DocumentScan] Response text:', responseText);
    throw new Error('Failed to parse document data from response');
  }
};

/**
 * Scan address document and extract data
 */
export const scanAddressDocument = async (useCamera: boolean = true): Promise<DocumentData> => {
  const imageUri = await captureDocument(useCamera);
  if (!imageUri) {
    throw new Error('No image captured');
  }

  return extractDocumentData(imageUri, 'address');
};

/**
 * Scan PAN card and extract data
 */
export const scanPANCard = async (useCamera: boolean = true): Promise<DocumentData> => {
  const imageUri = await captureDocument(useCamera);
  if (!imageUri) {
    throw new Error('No image captured');
  }

  return extractDocumentData(imageUri, 'pan');
};
