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