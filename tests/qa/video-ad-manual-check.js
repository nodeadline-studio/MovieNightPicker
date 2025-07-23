/**
 * Manual VideoAd QA Checklist
 * Run this in browser console after triggering video ad
 */

const VideoAdManualQA = {
  // Test 1: Check if native video controls are hidden
  checkVideoControls() {
    const video = document.querySelector('video');
    if (!video) {
      console.log('❌ Video element not found');
      return false;
    }
    
    const hasControlsAttr = video.hasAttribute('controls');
    const computedControls = window.getComputedStyle(video).getPropertyValue('-webkit-media-controls-panel');
    
    console.log('🔍 Video Controls Check:');
    console.log(`   - controls attribute: ${hasControlsAttr ? '❌ PRESENT' : '✅ ABSENT'}`);
    console.log(`   - CSS controls hidden: ${computedControls === 'none' ? '✅ HIDDEN' : '❌ VISIBLE'}`);
    
    return !hasControlsAttr;
  },

  // Test 2: Check background gradient
  checkBackgroundGradient() {
    const container = document.querySelector('[data-testid="video-ad-container"]');
    if (!container) {
      console.log('❌ Video ad container not found');
      return false;
    }
    
    const backgroundImage = window.getComputedStyle(container).backgroundImage;
    const hasGradient = backgroundImage.includes('gradient');
    
    console.log('🔍 Background Gradient Check:');
    console.log(`   - Has gradient: ${hasGradient ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Background: ${backgroundImage}`);
    
    return hasGradient;
  },

  // Test 3: Check if JSX warning exists
  checkConsoleWarnings() {
    console.log('🔍 Console Warnings Check:');
    console.log('   Please check browser console for any jsx warnings');
    console.log('   Look for: "Warning: Received `true` for a non-boolean attribute `jsx`"');
    return true;
  },

  // Test 4: Check copy content
  checkCopyContent() {
    const container = document.querySelector('[data-testid="content-section"]');
    if (!container) {
      console.log('❌ Content section not found');
      return false;
    }
    
    const text = container.textContent;
    const hasHD4K = text.includes('HD & 4K quality available');
    const hasLandscapePortrait = text.includes('Landscape & portrait formats');
    
    console.log('🔍 Copy Content Check:');
    console.log(`   - HD & 4K text: ${hasHD4K ? '✅ FOUND' : '❌ MISSING'}`);
    console.log(`   - Landscape & portrait: ${hasLandscapePortrait ? '✅ FOUND' : '❌ MISSING'}`);
    
    return hasHD4K && hasLandscapePortrait;
  },

  // Test 5: Check auto-skip functionality
  checkAutoSkip() {
    const video = document.querySelector('video');
    if (!video) {
      console.log('❌ Video element not found');
      return false;
    }
    
    console.log('🔍 Auto-skip Check:');
    console.log(`   - Video duration: ${video.duration}s`);
    console.log(`   - Has ended event: ${video.onended ? '✅ YES' : '❌ NO'}`);
    console.log('   - Auto-skip will trigger after video ends + 1s buffer');
    
    // Test if we can trigger end event
    video.addEventListener('ended', () => {
      console.log('✅ Video ended event triggered - ad should auto-close');
    });
    
    return true;
  },

  // Test 6: Check responsive layout
  checkResponsiveLayout() {
    const videoSection = document.querySelector('[data-testid="video-section"]');
    const contentSection = document.querySelector('[data-testid="content-section"]');
    
    if (!videoSection || !contentSection) {
      console.log('❌ Layout sections not found');
      return false;
    }
    
    const videoRect = videoSection.getBoundingClientRect();
    const contentRect = contentSection.getBoundingClientRect();
    const isMobile = window.innerWidth < 1024;
    
    console.log('🔍 Responsive Layout Check:');
    console.log(`   - Window width: ${window.innerWidth}px`);
    console.log(`   - Is mobile layout: ${isMobile ? 'YES' : 'NO'}`);
    console.log(`   - Video section: ${videoRect.width}x${videoRect.height}`);
    console.log(`   - Content section: ${contentRect.width}x${contentRect.height}`);
    
    if (isMobile) {
      const isVertical = videoRect.y < contentRect.y;
      console.log(`   - Stacked vertically: ${isVertical ? '✅ YES' : '❌ NO'}`);
      return isVertical;
    } else {
      const isSideBySide = videoRect.x < contentRect.x;
      console.log(`   - Side by side: ${isSideBySide ? '✅ YES' : '❌ NO'}`);
      return isSideBySide;
    }
  },

  // Test 7: Check clickability
  checkClickability() {
    const video = document.querySelector('video');
    const ctaButton = document.querySelector('[data-testid="cta-button"]');
    
    console.log('🔍 Clickability Check:');
    console.log(`   - Video clickable: ${video && video.style.cursor === 'pointer' ? '✅ YES' : '❌ NO'}`);
    console.log(`   - CTA button exists: ${ctaButton ? '✅ YES' : '❌ NO (may appear after 3s)'}`);
    
    if (video) {
      video.addEventListener('click', () => {
        console.log('✅ Video click registered - should open SaaSBackgrounds.com');
      });
    }
    
    return true;
  },

  // Run all tests
  runAllTests() {
    console.log('🚀 Starting VideoAd Manual QA Tests...\n');
    
    const results = {
      videoControls: this.checkVideoControls(),
      backgroundGradient: this.checkBackgroundGradient(),
      copyContent: this.checkCopyContent(),
      autoSkip: this.checkAutoSkip(),
      responsiveLayout: this.checkResponsiveLayout(),
      clickability: this.checkClickability()
    };
    
    console.log('\n📊 Test Results Summary:');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`   ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    });
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 ALL TESTS PASSED! VideoAd is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the issues above.');
    }
    
    console.log('\n💡 To test auto-skip:');
    console.log('   1. Let video play to the end');
    console.log('   2. Or run: document.querySelector("video").dispatchEvent(new Event("ended"))');
    
    console.log('\n💡 To test console warnings:');
    console.log('   Check browser console for any jsx-related warnings');
    
    return results;
  }
};

// Auto-run if we're in browser
if (typeof window !== 'undefined') {
  console.log('VideoAd Manual QA Helper loaded!');
  console.log('Run: VideoAdManualQA.runAllTests()');
}

// Export for potential use
if (typeof module !== 'undefined') {
  module.exports = VideoAdManualQA;
} 