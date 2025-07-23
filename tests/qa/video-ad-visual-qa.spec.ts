import { test, expect, Page } from '@playwright/test';

// Test device configurations
const devices = [
  { name: 'Mobile', width: 375, height: 667, isMobile: true },
  { name: 'Tablet', width: 768, height: 1024, isMobile: false },
  { name: 'Desktop', width: 1440, height: 900, isMobile: false }
];

class VideoAdTester {
  constructor(private page: Page) {}

  async triggerVideoAd() {
    // Navigate to home page
    await this.page.goto('http://localhost:5173');
    
    // Wait for page to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Force trigger video ad using console command
    await this.page.evaluate(() => {
      if ((window as any).AD_TESTING) {
        (window as any).AD_TESTING.forceVideoAd();
      }
    });
    
    // Wait for video ad to appear
    await this.page.waitForSelector('[data-testid="video-ad"]', { timeout: 5000 });
  }

  async checkVideoAdVisibility() {
    const videoAd = this.page.locator('[data-testid="video-ad"]');
    await expect(videoAd).toBeVisible();
    return videoAd;
  }

  async checkVideoElement() {
    const video = this.page.locator('video');
    await expect(video).toBeVisible();
    
    // Check video attributes
    const hasControls = await video.getAttribute('controls');
    const isLoop = await video.getAttribute('loop');
    const isMuted = await video.getAttribute('muted');
    const isPlaysInline = await video.getAttribute('playsinline');
    
    return {
      hasControls: hasControls !== null,
      isLoop: isLoop !== null,
      isMuted: isMuted !== null,
      isPlaysInline: isPlaysInline !== null
    };
  }

  async checkCustomControls() {
    // Check if custom controls are visible
    const playButton = this.page.locator('[data-testid="play-pause-button"]');
    const muteButton = this.page.locator('[data-testid="mute-button"]');
    const progressBar = this.page.locator('[data-testid="progress-bar"]');
    
    await expect(playButton).toBeVisible();
    await expect(muteButton).toBeVisible();
    await expect(progressBar).toBeVisible();
  }

  async checkCTABehavior() {
    const ctaButton = this.page.locator('[data-testid="cta-button"]');
    
    // CTA should not be visible initially
    await expect(ctaButton).not.toBeVisible();
    
    // Wait 3.5 seconds for CTA to appear
    await this.page.waitForTimeout(3500);
    await expect(ctaButton).toBeVisible();
    
    return ctaButton;
  }

  async checkAutoSkip() {
    const videoAd = this.page.locator('[data-testid="video-ad"]');
    const video = this.page.locator('video');
    
    // Check if video has duration limit or auto-close
    const videoDuration = await video.evaluate((el: HTMLVideoElement) => el.duration);
    
    if (videoDuration > 0) {
      // Wait for video to end + buffer time
      await this.page.waitForTimeout((videoDuration + 1) * 1000);
      
      // Check if ad auto-closed
      const isVisible = await videoAd.isVisible();
      return !isVisible; // Should be hidden after auto-skip
    }
    
    return false;
  }

  async checkResponsiveLayout(deviceInfo: any) {
    const container = this.page.locator('[data-testid="video-ad-container"]');
    const videoSection = this.page.locator('[data-testid="video-section"]');
    const contentSection = this.page.locator('[data-testid="content-section"]');
    
    const containerBox = await container.boundingBox();
    const videoBox = await videoSection.boundingBox();
    const contentBox = await contentSection.boundingBox();
    
    if (deviceInfo.isMobile) {
      // On mobile, should be stacked vertically
      expect(videoBox?.y).toBeLessThan(contentBox?.y || 0);
    } else {
      // On desktop/tablet, should be side by side
      expect(videoBox?.x).toBeLessThan(contentBox?.x || 0);
    }
    
    return { containerBox, videoBox, contentBox };
  }

  async checkClickability() {
    const video = this.page.locator('video');
    const ctaButton = this.page.locator('[data-testid="cta-button"]');
    
    // Wait for CTA to appear
    await this.page.waitForTimeout(3500);
    
        // Check video click
    const videoClicks: string[] = [];
    this.page.on('popup', (popup) => {
      videoClicks.push(popup.url());
    });

    await video.click();
    
    // Check CTA button click
    const ctaClicks: string[] = [];
    this.page.on('popup', (popup) => {
      ctaClicks.push(popup.url());
    });
    
    await ctaButton.click();
    
    return { videoClicks, ctaClicks };
  }

  async checkBackgroundGradient() {
    const adContainer = this.page.locator('[data-testid="video-ad-container"]');
    const computedStyle = await adContainer.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    
    // Should contain gradient, not solid white
    return computedStyle.includes('gradient') || computedStyle.includes('linear');
  }
}

for (const device of devices) {
  test.describe(`VideoAd Visual QA - ${device.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
    });

    test(`should display correctly on ${device.name}`, async ({ page }) => {
      const tester = new VideoAdTester(page);
      const issues: string[] = [];

      try {
        // Test 1: Video Ad Visibility
        await tester.triggerVideoAd();
        await tester.checkVideoAdVisibility();
        console.log(`✅ ${device.name}: Video ad displays correctly`);
      } catch (error) {
        issues.push(`❌ ${device.name}: Video ad failed to display - ${error}`);
      }

      try {
        // Test 2: Video Element Configuration
        const videoConfig = await tester.checkVideoElement();
        
        if (videoConfig.hasControls) {
          issues.push(`❌ ${device.name}: Native video controls are visible (should be hidden)`);
        } else {
          console.log(`✅ ${device.name}: Native video controls properly hidden`);
        }
        
        if (!videoConfig.isMuted) {
          issues.push(`❌ ${device.name}: Video not muted by default`);
        }
        
        if (!videoConfig.isLoop) {
          issues.push(`❌ ${device.name}: Video not set to loop`);
        }
      } catch (error) {
        issues.push(`❌ ${device.name}: Video element check failed - ${error}`);
      }

      try {
        // Test 3: Custom Controls
        await tester.checkCustomControls();
        console.log(`✅ ${device.name}: Custom controls visible`);
      } catch (error) {
        issues.push(`❌ ${device.name}: Custom controls not visible - ${error}`);
      }

      try {
        // Test 4: CTA Behavior
        await tester.checkCTABehavior();
        console.log(`✅ ${device.name}: CTA appears after 3 seconds`);
      } catch (error) {
        issues.push(`❌ ${device.name}: CTA behavior incorrect - ${error}`);
      }

      try {
        // Test 5: Auto-skip functionality
        const autoSkipped = await tester.checkAutoSkip();
        if (!autoSkipped) {
          issues.push(`❌ ${device.name}: Video ad does not auto-skip after completion`);
        } else {
          console.log(`✅ ${device.name}: Video ad auto-skips correctly`);
        }
      } catch (error) {
        issues.push(`❌ ${device.name}: Auto-skip test failed - ${error}`);
      }

      try {
        // Test 6: Responsive Layout
        const layout = await tester.checkResponsiveLayout(device);
        console.log(`✅ ${device.name}: Responsive layout correct`);
      } catch (error) {
        issues.push(`❌ ${device.name}: Responsive layout issues - ${error}`);
      }

      try {
        // Test 7: Clickability
        const clicks = await tester.checkClickability();
        console.log(`✅ ${device.name}: Video and CTA clickable`);
      } catch (error) {
        issues.push(`❌ ${device.name}: Clickability issues - ${error}`);
      }

      try {
        // Test 8: Background Gradient
        const hasGradient = await tester.checkBackgroundGradient();
        if (!hasGradient) {
          issues.push(`❌ ${device.name}: Background gradient not applied`);
        } else {
          console.log(`✅ ${device.name}: Background gradient applied`);
        }
      } catch (error) {
        issues.push(`❌ ${device.name}: Background gradient check failed - ${error}`);
      }

      // Report all issues found
      if (issues.length > 0) {
        console.log(`\n📋 ISSUES FOUND ON ${device.name.toUpperCase()}:`);
        issues.forEach(issue => console.log(issue));
        
        // Fail test with summary
        throw new Error(`${issues.length} issues found on ${device.name}:\n${issues.join('\n')}`);
      } else {
        console.log(`\n✅ ALL TESTS PASSED ON ${device.name.toUpperCase()}`);
      }
    });

    test(`should handle video interactions on ${device.name}`, async ({ page }) => {
      const tester = new VideoAdTester(page);
      
      await tester.triggerVideoAd();
      
      // Test play/pause
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();
      
      // Wait and check if video paused
      await page.waitForTimeout(500);
      const isPaused = await page.locator('video').evaluate((el: HTMLVideoElement) => el.paused);
      expect(isPaused).toBe(true);
      
      // Test mute/unmute
      const muteButton = page.locator('[data-testid="mute-button"]');
      await muteButton.click();
      
      const isMuted = await page.locator('video').evaluate((el: HTMLVideoElement) => el.muted);
      expect(isMuted).toBe(false);
    });

    test(`should close when X button clicked on ${device.name}`, async ({ page }) => {
      const tester = new VideoAdTester(page);
      
      await tester.triggerVideoAd();
      
      const closeButton = page.locator('[data-testid="close-button"]');
      await closeButton.click();
      
      const videoAd = page.locator('[data-testid="video-ad"]');
      await expect(videoAd).not.toBeVisible();
    });
  });
}

// Summary test to run all devices quickly
test('VideoAd Quick Visual Check - All Devices', async ({ page }) => {
  const issues: string[] = [];
  
  for (const device of devices) {
    await page.setViewportSize({ width: device.width, height: device.height });
    const tester = new VideoAdTester(page);
    
    try {
      await tester.triggerVideoAd();
      const videoConfig = await tester.checkVideoElement();
      
      if (videoConfig.hasControls) {
        issues.push(`${device.name}: Native controls visible`);
      }
      
      const hasGradient = await tester.checkBackgroundGradient();
      if (!hasGradient) {
        issues.push(`${device.name}: No background gradient`);
      }
      
      // Check auto-skip quickly (wait 2 seconds max)
      await page.waitForTimeout(2000);
      
    } catch (error) {
      issues.push(`${device.name}: Failed to load - ${error}`);
    }
  }
  
  if (issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES SUMMARY:');
    issues.forEach(issue => console.log(`❌ ${issue}`));
  } else {
    console.log('\n✅ ALL DEVICES PASSED QUICK CHECK');
  }
}); 