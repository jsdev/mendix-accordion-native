/**
 * Jest setup file for configuring the test environment
 */

// Add TextEncoder/TextDecoder polyfill for jsdom
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Add any global test utilities here
