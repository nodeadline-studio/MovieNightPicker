// Utility functions for sharing capabilities

export const canUseNativeShare = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

export const canShareFiles = (): boolean => {
  return canUseNativeShare() && 
         typeof navigator.canShare === 'function';
};

export const canUseClipboard = (): boolean => {
  return typeof navigator !== 'undefined' && 
         'clipboard' in navigator && 
         typeof navigator.clipboard.write === 'function';
};

export const canShareWithFiles = (files: File[]): boolean => {
  if (!canShareFiles()) return false;
  
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
};

// Check if we're on mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if we're on Chrome mobile
export const isChromeMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) && 
         /Chrome/i.test(navigator.userAgent) &&
         !/Edge/i.test(navigator.userAgent);
};

// Check if we're on Safari mobile
export const isSafariMobile = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
         /Safari/i.test(navigator.userAgent) &&
         !/Chrome/i.test(navigator.userAgent);
};

// Get the best sharing method available
export const getBestSharingMethod = (): 'native' | 'clipboard' | 'download' => {
  if (canUseNativeShare() && isMobileDevice()) {
    return 'native';
  }
  
  if (canUseClipboard()) {
    return 'clipboard';
  }
  
  return 'download';
};

// Check if native sharing with files is reliable on current browser
export const isNativeFileSharingReliable = (): boolean => {
  // Safari mobile has good native file sharing support
  if (isSafariMobile()) return true;
  
  // Chrome mobile can be unreliable with file sharing
  if (isChromeMobile()) return false;
  
  // Other mobile browsers
  if (isMobileDevice()) return canShareWithFiles([]);
  
  return false;
}; 