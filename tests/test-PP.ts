import type { RawPage } from '../src/utils/git-service';
import { processPage, processAllPages } from '../src/utils/pages-processor';
import Lexer from '../src/scripts/lexer';
import Parser from '../src/scripts/parser';
import Renderer from '../src/scripts/renderer';

// Create test data
function createTestRawPages(): RawPage[] {
    return [
        {
            slug: ['test', 'simple-page'],
            filePath: '/test/simple-page.txt',
            content: `====== Simple Test Page ======

This is a simple test page with some content.

===== Section 1 =====

This is the first **section** with some text.

===== Section 2 =====

This is the __second__ //section// with more text.`,
            lastModified: new Date('29 May 2025'),
            size: 150
        },
        {
            slug: ['test', 'complex-page'],
            filePath: '/test/complex-page.wiki',
            content: `====== Complex Test Page ======

This is a more complex page with multiple sections and content.

===== Introduction =====

Welcome to this __//complex page//__ that demonstrates various features.

==== Subsection A ====

This is a subsection with detailed **//information//**.

==== Subsection B ====

Another subsection with different content.

===== Conclusion =====

This concludes our complex page example.`,
            lastModified: new Date('28 May 2025'),
            size: 300
        },
        {
            slug: ['broken-page'],
            filePath: '/broken-page.wiki',
            content: `====== Broken Page ======

This page might cause issues...

{{invalid_syntax_here}}

===== Still Valid Section =====

But this part should work fine.`,
            lastModified: new Date('3 May 2025'),
            size: 100
        }
    ];
}

// Test individual page processing
export async function testSinglePage() {
    console.log('\n=== TESTING SINGLE PAGE PROCESSING ===');
    
    // Temporarily replace your actual lexer/parser/renderer with mocks
    // You'll need to modify your PageProcessor imports or create a way to inject these
    
    const testPage = createTestRawPages()[0];
    
    try {
        console.log(`Testing page: ${testPage.slug.join('/')}`);
        
        // You might need to modify PageProcessor to accept these as parameters
        // or temporarily replace the imports
        const result = await processPage(testPage, {
            enableCaching: false,
            validateOutput: true,
            generateTOC: true
        });
        
        console.log('✅ Single page processing successful!');
        console.log('Generated HTML preview:', result.htmlContent.substring(0, 200) + '...');
        console.log('Extracted title:', result.title);
        console.log('Excerpt:', result.excerpt);
        console.log('Processing time:', result.metadata.processingTime + 'ms');
        console.log('Word count:', result.metadata.wordCount);
        console.log('Reading time:', result.metadata.readingTime + ' min');
        
        if (result.toc && result.toc.length > 0) {
            console.log('Table of contents:');
            result.toc.forEach(item => {
                console.log(`  ${'  '.repeat(item.level - 1)}- ${item.title} (#${item.anchor})`);
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Single page processing failed:', error);
        throw error;
    }
}

// Test batch processing
export async function testBatchProcessing() {
    console.log('\n=== TESTING BATCH PROCESSING ===');
    
    const testPages = createTestRawPages();
    
    try {
        console.log(`Testing ${testPages.length} pages...`);
        
        const { processedPages, stats } = await processAllPages(testPages, {
            enableCaching: false,
            validateOutput: true,
            generateTOC: true
        });
        
        console.log('✅ Batch processing completed!');
        console.log('Statistics:');
        console.log(`  Total pages: ${stats.totalPages}`);
        console.log(`  Successful: ${stats.successfulPages}`);
        console.log(`  Failed: ${stats.failedPages}`);
        console.log(`  Total time: ${stats.totalProcessingTime}ms`);
        console.log(`  Average time: ${Math.round(stats.averageProcessingTime)}ms per page`);
        
        if (stats.errors.length > 0) {
            console.log('\nErrors encountered:');
            stats.errors.forEach(error => {
                console.log(`  ❌ ${error.filePath} (${error.stage}): ${error.error.message}`);
            });
        }
        
        console.log('\nProcessed pages:');
        processedPages.forEach(page => {
            console.log(`  ✅ ${page.slug.join('/')} - "${page.title}" (${page.metadata.wordCount} words)`);
        });
        
        return { processedPages, stats };
        
    } catch (error) {
        console.error('❌ Batch processing failed:', error);
        throw error;
    }
}

// Test error handling
export async function testErrorHandling() {
    console.log('\n=== TESTING ERROR HANDLING ===');
    
    // Create a page that will definitely cause errors
    const errorPage: RawPage = {
        slug: ['error-test'],
        filePath: '/error-test.wiki',
        content: 'This will cause lexer errors: {{{{invalid}}}}',
        lastModified: new Date(),
        size: 50
    };
    
    try {
        const result = await processPage(errorPage);
        console.log('LAWE: Expected error but processing succeeded:', result.title);
    } catch (e) {
        if (e instanceof Error ) {
            console.log('Error handling working correctly:', e.message)
        } else {
            console.log('Error handling working correctly with non-Error:', e);
        }

    }
}

// Test performance with many pages
export async function testPerformance() {
    console.log('\n=== TESTING PERFORMANCE ===');
    
    // Generate many test pages
    const manyPages: RawPage[] = [];
    for (let i = 0; i < 50; i++) {
        manyPages.push({
            slug: ['performance', `page-${i}`],
            filePath: `/performance/page-${i}.wiki`,
            content: `# Performance Test Page ${i}

This is test page number ${i} for performance testing.

## Section 1
Content for section 1 of page ${i}.

## Section 2  
Content for section 2 of page ${i}.

This page has approximately 50 words for testing processing speed.`,
            lastModified: new Date(),
            size: 200
        });
    }
    
    const startTime = Date.now();
    const { processedPages, stats } = await processAllPages(manyPages);
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ Processed ${processedPages.length} pages in ${totalTime}ms`);
    console.log(`Average: ${Math.round(totalTime / processedPages.length)}ms per page`);
    console.log(`Pages per second: ${Math.round(processedPages.length / (totalTime / 1000))}`);
}

// Main test runner
export async function runAllTests() {
    console.log('LAWE: STARTING PP TESTS');
    
    try {
        await testSinglePage();
        await testBatchProcessing();
        await testErrorHandling();
        await testPerformance();
        
        console.log('\nLAWE: ALL TESTS COMPLETED SUCCESSFULLY!');
        
    } catch (error) {
        console.error('\nLAWE: TESTS FAILED:', error);
        process.exit(1);
    }
}

// CLI runner - uncomment to run directly
// if (require.main === module) {
//     runAllTests();
// }

