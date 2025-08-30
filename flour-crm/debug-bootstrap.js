// Bootstrap Debug Script - Run in browser console
console.log("🔍 Bootstrap Diagnostic Script");

// Test 1: Check if Bootstrap CSS is loaded
function testBootstrapCSS() {
    const testDiv = document.createElement('div');
    testDiv.className = 'btn btn-primary d-none';
    document.body.appendChild(testDiv);
    
    const styles = window.getComputedStyle(testDiv);
    const isLoaded = styles.backgroundColor === 'rgb(13, 110, 253)';
    
    document.body.removeChild(testDiv);
    console.log(`Bootstrap CSS: ${isLoaded ? '✅ LOADED' : '❌ NOT LOADED'}`);
    return isLoaded;
}

// Test 2: Check if Bootstrap JS is loaded
function testBootstrapJS() {
    const isLoaded = typeof bootstrap !== 'undefined';
    console.log(`Bootstrap JS: ${isLoaded ? '✅ LOADED' : '❌ NOT LOADED'}`);
    return isLoaded;
}

// Test 3: Check CDN connectivity
async function testCDN() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css', { method: 'HEAD' });
        console.log(`CDN Access: ${response.ok ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE'}`);
        return response.ok;
    } catch (error) {
        console.log(`CDN Access: ❌ ERROR - ${error.message}`);
        return false;
    }
}

// Test 4: Check for CSS link tags
function testLinkTags() {
    const bootstrapLinks = document.querySelectorAll('link[href*="bootstrap"]');
    console.log(`Bootstrap <link> tags found: ${bootstrapLinks.length}`);
    bootstrapLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.href}`);
    });
    return bootstrapLinks.length > 0;
}

// Run all tests
async function runAllTests() {
    console.log("=".repeat(50));
    testLinkTags();
    testBootstrapCSS();
    testBootstrapJS();
    await testCDN();
    console.log("=".repeat(50));
}

// Auto-run
runAllTests();
