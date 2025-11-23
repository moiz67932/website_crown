# Landing Page Generation - Logging Guide

## Log Format Reference

This guide explains the new comprehensive logging format for landing page generation.

## Log Symbols

- 🎨 - Start/rendering operations
- ✅ - Success
- ❌ - Error/failure
- ⚠️ - Warning
- 🔄 - Retry/retry attempt
- 📝 - Writing/generating content
- 📊 - Statistics/counts
- 📄 - Document/content
- 🖼️ - Images
- 🔍 - Searching/checking
- 💾 - Persisting/saving
- 🌐 - Network request
- 🔢 - Numbers/calculations
- ⏳ - Waiting
- ℹ️ - Info
- ⏱️ - Timeout
- ✂️ - Truncation

## AI Content Generation Logs

### Successful Generation Flow

```
[ai.desc] START { city: 'san diego', kind: 'homes-over-1m', force: true, envOpenAI: true }
  ↓
[ai.desc] 📝 Preparing OpenAI call { key: 'san diego::homes-over-1m', model: 'gpt-4o-mini' }
  ↓
[ai.desc] 📊 Target word count { desiredMin: 1200, desiredMax: 2000 }
  ↓
[ai.desc] 🔢 Token budget { approxTokens: 3600 }
  ↓
[ai.desc] 🔄 Calling OpenAI API { model: 'gpt-4o-mini', maxTokens: 3600 }
  ↓
[ai.desc] ✅ OpenAI response received { ms: 4500, contentLength: 6800, tokensUsed: 2800 }
  ↓
[ai.desc] 📄 OpenAI raw response { hasContent: true, length: 6800 }
  ↓
[ai.desc] 🔍 Repetition check { totalSentences: 45, uniqueSentences: 42, repetitionRatio: 0.93 }
  ↓
[ai.desc] 📊 Initial word count { words: 1850, desiredMin: 1200, desiredMax: 2000 }
  ↓
[ai.desc] ✅ HTML paragraphs ensured { length: 6800 }
  ↓
[ai.desc] 📊 Final content check { wordCount: 1850, targetWords: 2000 }
  ↓
[ai.desc] ✅ Content generation complete { length: 6800, finalWordCount: 1850 }
  ↓
[ai.desc] 💾 Persisting to Supabase { willPersist: true }
  ↓
[ai.desc] ✅ Supabase upsert success
```

### Content Too Short (Retry Flow)

```
[ai.desc] 📊 Initial word count { words: 800, desiredMin: 1200, desiredMax: 2000 }
  ↓
[ai.desc] 📉 Content below minimum, will retry { words: 800, desiredMin: 1200, maxRetries: 2 }
  ↓
[ai.desc] 🔄 Retry attempt { attempt: 1, desiredMin: 1200, desiredMax: 2000 }
  ↓
[ai.desc] 🔄 Calling OpenAI API { model: 'gpt-4o-mini', maxTokens: 3600 }
  ↓
[ai.desc] ✅ OpenAI response received { ms: 5200, contentLength: 7500 }
  ↓
[ai.desc] ✅ Retry produced content { attempt: 1, words: 1900 }
```

### Content Too Long (Truncation)

```
[ai.desc] 📊 Initial word count { words: 2500, desiredMin: 1200, desiredMax: 2000 }
  ↓
[ai.desc] ✂️ Content exceeds max, truncating { produced: 2500, max: 2000 }
  ↓
[ai.desc] 📊 Truncated word count { words: 2000 }
```

### API Error Flow

```
[ai.desc] 🔄 Calling OpenAI API { model: 'gpt-4o-mini', maxTokens: 3600 }
  ↓
[ai.desc] ❌ OpenAI error { 
  message: 'Unsupported parameter: presence_penalty',
  status: 400,
  type: 'invalid_request_error'
}
  ↓
[ai.desc] ⚠️ Primary model returned empty content { model: 'gpt-4o-mini' }
  ↓
[ai.desc] 🔄 Retrying with fallback model { model: 'gpt-4o' }
```

### Fallback Content Generation

```
[ai.desc] ⚠️ OpenAI returned empty content, using fallback generator { key: 'san diego::homes-over-1m' }
  ↓
[ai.desc] 📝 Generating fallback content { fallbackWords: 1200 }
  ↓
[ai.desc] 📝 Generated fallback content { city: 'San Diego', kind: 'homes over 1m', sections: 8, words: 1250 }
  ↓
[ai.desc] ✅ Fallback generated { length: 5600, wordCount: 1250 }
```

## Image Fetching Logs

### Successful Image Fetch

```
[landing.inline] 🎨 START fetching inline images { city: 'san diego', kind: 'homes-over-1m' }
  ↓
[landing.inline] 🔍 Checking Supabase cache
  ↓
[landing.inline] ℹ️ Supabase cache miss { hasData: true, hasImages: false }
  ↓
[landing.inline] 🔍 Fetching from Unsplash
  ↓
[landing.inline] 📝 Using prompts: [
  'San Diego residential streetscape...',
  'San Diego skyline aerial...',
  'San Diego lifestyle at parks...',
  'San Diego modern home interior...'
]
  ↓
[landing.inline] 🌐 Fetching image 1/4 { query: 'San Diego residential streetscape...' }
[landing.inline] ✅ Got image 1/4 { url: 'https://images.unsplash.com/photo...', alt: 'Palm trees...' }
  ↓
[landing.inline] 🌐 Fetching image 2/4
[landing.inline] ✅ Got image 2/4
  ↓
[landing.inline] 🌐 Fetching image 3/4
[landing.inline] ✅ Got image 3/4
  ↓
[landing.inline] 🌐 Fetching image 4/4
[landing.inline] ✅ Got image 4/4
  ↓
[landing.inline] 📊 Fetched results { total: 4, successful: 4 }
  ↓
[landing.inline] 💾 Persisting to Supabase { count: 4 }
  ↓
[landing.inline] ✅ Supabase upsert success
  ↓
[landing.inline] ✅ DONE { count: 4 }
```

### Cache Hit

```
[landing.inline] 🎨 START fetching inline images { city: 'san diego', kind: 'homes-over-1m' }
  ↓
[landing.inline] ✅ Memory cache hit { count: 4 }
```

### Supabase Cache Hit

```
[landing.inline] 🔍 Checking Supabase cache
  ↓
[landing.inline] ✅ Supabase cache hit { 
  count: 4,
  images: [
    { position: 'inline_1', url: 'https://images.unsplash...' },
    { position: 'inline_2', url: 'https://images.unsplash...' },
    { position: 'inline_3', url: 'https://images.unsplash...' },
    { position: 'inline_4', url: 'https://images.unsplash...' }
  ]
}
```

### Image Fetch Failure

```
[landing.inline] 🌐 Fetching image 2/4
  ↓
[landing.inline] ❌ Unsplash HTTP error 2/4 { status: 403, query: '...' }
  or
[landing.inline] ⚠️ No image found 2/4 { resultsCount: 0 }
  or
[landing.inline] ❌ Fetch exception 2/4 { error: 'Network timeout' }
```

### Missing API Key

```
[landing.inline] ❌ UNSPLASH_ACCESS_KEY missing
```

## Component Rendering Logs

### AIDescription Component

```
[AIDescription] 🎨 START Rendering { city: 'San Diego', kind: 'homes-over-1m', htmlLength: 6800 }
  ↓
[AIDescription] 📊 Parsed sections { 
  count: 7,
  sections: [
    { index: 0, hasHeading: true, headingPreview: 'Discover San Diego homes over 1m', contentLength: 850 },
    { index: 1, hasHeading: true, headingPreview: 'Neighborhood character...', contentLength: 720 },
    ...
  ]
}
  ↓
[AIDescription] 🖼️ Fetching images...
  ↓
[AIDescription] 🖼️ Images fetched { 
  count: 4,
  positions: ['inline_1', 'inline_2', 'inline_3', 'inline_4'],
  urls: ['https://images.unsplash...', ...]
}
  ↓
[AIDescription] 📄 Rendering section 0: {
  hasHeading: true,
  headingText: 'Discover San Diego homes over 1m',
  contentLength: 850,
  shouldShowImage: false,
  imageIndex: -1,
  hasImage: false
}
  ↓
[AIDescription] 📄 Rendering section 1: {
  hasHeading: true,
  headingText: 'Neighborhood character...',
  contentLength: 720,
  shouldShowImage: true,
  imageIndex: 0,
  hasImage: true,
  imageUrl: 'https://images.unsplash...'
}
```

## Troubleshooting with Logs

### Problem: No content generated

Look for:
```
[ai.desc] ⚠️ Skipping OpenAI generation { reason: 'Missing API key' }
```
**Solution**: Set `OPENAI_API_KEY` environment variable

### Problem: Content too short

Look for:
```
[ai.desc] 📉 Content below minimum, will retry { words: 800, desiredMin: 1200 }
```
**Solution**: Increase `OPENAI_MAX_TOKENS` or adjust `LANDING_MIN_WORDS`

### Problem: Repetitive content

Look for:
```
[ai.desc] 🔍 Repetition check { repetitionRatio: 0.65, isRepetitive: true }
[ai.desc] ⚠️ Detected repetitive content, will retry
```
**Solution**: System will automatically retry. If persists, the improved fallback will generate unique content.

### Problem: No images

Look for:
```
[landing.inline] ❌ UNSPLASH_ACCESS_KEY missing
```
**Solution**: Set `UNSPLASH_ACCESS_KEY` environment variable

Or:
```
[landing.inline] 📊 Fetched results { total: 4, successful: 0 }
```
**Solution**: Check Unsplash API rate limits or query terms

### Problem: API errors

Look for:
```
[ai.desc] ❌ OpenAI error { 
  message: 'Unsupported parameter: presence_penalty',
  status: 400
}
```
**Solution**: This is now fixed - the parameters have been removed

## Environment Variables

Enable detailed logging:
```env
LANDING_TRACE=true
LANDING_DEBUG=true
```

Configure content generation:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=3000
OPENAI_TIMEOUT_MS=25000
LANDING_MIN_WORDS=1200
LANDING_MAX_WORDS=2000
```

Configure image fetching:
```env
UNSPLASH_ACCESS_KEY=...
```

Skip external fetches (for testing):
```env
SKIP_LANDING_EXTERNAL_FETCHES=1
```
