/**
 * Test script to verify HTML character encoding and icon display
 */

const fs = require('fs');
const path = require('path');

console.log('Testing HTML Character Encoding and Icon Display...\n');

// Test 1: Check HTML file has UTF-8 encoding
console.log('Test 1: Checking HTML encoding...');
const htmlContent = fs.readFileSync('index.html', 'utf8');

const hasCharsetMeta = htmlContent.includes('<meta charset="UTF-8">');
const hasContentTypeMeta = htmlContent.includes('<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">');
const hasLangAttribute = htmlContent.includes('<html lang="en">');

console.log(`  ✓ UTF-8 charset meta tag: ${hasCharsetMeta ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Content-Type meta tag: ${hasContentTypeMeta ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ HTML lang attribute: ${hasLangAttribute ? 'PASS' : 'FAIL'}`);

// Test 2: Check emoji icons are present
console.log('\nTest 2: Checking emoji icons...');
const emojiIcons = ['🔊', '⚡', '✨', '💫', '📹', '🎵'];
let allEmojisPresent = true;

emojiIcons.forEach(emoji => {
    const present = htmlContent.includes(emoji);
    console.log(`  ${present ? '✓' : '✗'} Emoji ${emoji}: ${present ? 'PASS' : 'FAIL'}`);
    if (!present) allEmojisPresent = false;
});

// Test 3: Check fallback text structure
console.log('\nTest 3: Checking fallback text structure...');
const hasFallbackClass = htmlContent.includes('class="icon-fallback"');
const hasFallbackCSS = htmlContent.includes('.no-emoji-support .icon-fallback');
const hasEmojiClass = htmlContent.includes('class="icon-emoji"');

console.log(`  ✓ Icon fallback class: ${hasFallbackClass ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Icon emoji class: ${hasEmojiClass ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Fallback CSS rules: ${hasFallbackCSS ? 'PASS' : 'FAIL'}`);

// Test 4: Check data attributes
console.log('\nTest 4: Checking data attributes...');
const hasDataCount = htmlContent.includes('data-count="1"') && 
                     htmlContent.includes('data-count="2"') &&
                     htmlContent.includes('data-count="3"') &&
                     htmlContent.includes('data-count="4"');
const hasDataLevel = htmlContent.includes('data-level="easy"') &&
                     htmlContent.includes('data-level="medium"') &&
                     htmlContent.includes('data-level="hard"');

console.log(`  ✓ AI count data attributes: ${hasDataCount ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Difficulty level data attributes: ${hasDataLevel ? 'PASS' : 'FAIL'}`);

// Test 5: Check script.js has emoji detection
console.log('\nTest 5: Checking emoji detection in script.js...');
const scriptContent = fs.readFileSync('script.js', 'utf8');
const hasEmojiDetection = scriptContent.includes('detectEmojiSupport');
const hasInitIconDisplay = scriptContent.includes('initializeIconDisplay');

console.log(`  ✓ Emoji detection function: ${hasEmojiDetection ? 'PASS' : 'FAIL'}`);
console.log(`  ✓ Icon display initialization: ${hasInitIconDisplay ? 'PASS' : 'FAIL'}`);

// Summary
console.log('\n' + '='.repeat(50));
const allTestsPassed = hasCharsetMeta && hasContentTypeMeta && hasLangAttribute &&
                       allEmojisPresent && hasFallbackClass && hasFallbackCSS &&
                       hasEmojiClass && hasDataCount && hasDataLevel &&
                       hasEmojiDetection && hasInitIconDisplay;

if (allTestsPassed) {
    console.log('✓ ALL TESTS PASSED');
    console.log('\nHTML character encoding and icon display are properly configured.');
    console.log('The game will:');
    console.log('  - Use UTF-8 encoding for proper emoji display');
    console.log('  - Display emoji icons when supported');
    console.log('  - Fall back to text labels when emoji is not supported');
    console.log('  - Have proper data attributes for UI controls');
} else {
    console.log('✗ SOME TESTS FAILED');
    console.log('\nPlease review the failed tests above.');
}

console.log('='.repeat(50));
