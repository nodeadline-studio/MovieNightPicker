#!/bin/bash

# Video Optimization Script for MovieNightPicker
# Usage: ./scripts/optimize-video.sh input_video.mp4

if [ $# -eq 0 ]; then
    echo "Usage: $0 <input_video.mp4>"
    echo "Example: $0 public/ad_preview.mp4"
    exit 1
fi

INPUT_FILE="$1"
BASE_NAME=$(basename "$INPUT_FILE" .mp4)
DIR_NAME=$(dirname "$INPUT_FILE")

echo "🎬 Optimizing video: $INPUT_FILE"
echo "📁 Output directory: $DIR_NAME"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Please install it first:"
    echo "   brew install ffmpeg"
    exit 1
fi

# Create optimized version (1080p, good quality)
echo "🔄 Creating optimized version (1080p)..."
ffmpeg -i "$INPUT_FILE" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 \
    -preset medium \
    -crf 28 \
    -c:a aac \
    -b:a 128k \
    -movflags +faststart \
    "$DIR_NAME/${BASE_NAME}_optimized.mp4" \
    -y

# Create mobile version (720p, smaller size)
echo "📱 Creating mobile version (720p)..."
ffmpeg -i "$INPUT_FILE" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 \
    -preset medium \
    -crf 32 \
    -c:a aac \
    -b:a 96k \
    -movflags +faststart \
    "$DIR_NAME/${BASE_NAME}_mobile.mp4" \
    -y

# Create poster image
echo "🖼️  Creating poster image..."
ffmpeg -i "$DIR_NAME/${BASE_NAME}_optimized.mp4" \
    -ss 00:00:02 \
    -vframes 1 \
    -q:v 2 \
    "$DIR_NAME/${BASE_NAME}_poster.jpg" \
    -y

echo ""
echo "✅ Optimization complete!"
echo ""
echo "📊 File sizes:"
ls -lh "$INPUT_FILE" "$DIR_NAME/${BASE_NAME}_optimized.mp4" "$DIR_NAME/${BASE_NAME}_mobile.mp4" "$DIR_NAME/${BASE_NAME}_poster.jpg"

echo ""
echo "💡 Usage in code:"
echo "   Desktop: /${BASE_NAME}_optimized.mp4"
echo "   Mobile:  /${BASE_NAME}_mobile.mp4"
echo "   Poster:  /${BASE_NAME}_poster.jpg" 