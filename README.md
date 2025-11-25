# AI Marketing Assistant

A flexible, white-label AI marketing assistant that can be customized for any business, market, or country. This solution provides comprehensive marketing automation, content creation, and campaign management capabilities.

## Features

### Core Capabilities
- **Adaptive Language Support** - Automatically adapts to user's preferred language
- **Business Profiling** - Interactive interview system to understand business needs
- **Content Generation** - AI-powered image and video creation with Sora 2 and Gemini
- **Landing Page Builder** - Create professional marketing pages and export as HTML
- **Task Automation** - Schedule reminders and automated marketing tasks
- **Search Integration** - Google search and image search capabilities
- **Email Marketing** - Send targeted marketing emails

### Memory System
Simple and effective memory management with automatic cleanup:
- Persistent storage for business profiles
- Temporary storage with expiration
- Automatic cleanup of expired items
- Priority loading for frequently accessed data

### Content Creation Tools
- **Image Generation**: Support for Gemini and GPT models
- **Video Creation**: Sora 2 integration for dynamic video content
- **Web Publishing**: Create and host landing pages instantly
- **Template Library**: Pre-designed templates for various industries

## Quick Start

1. Configure your settings in `app/settings.json`
2. Customize behavior in `app/instructions.txt`
3. Start creating marketing content!

## Command Examples

### Set Business Profile
```xml
<setMemory>
{
  "itemId": "memory_business_profile",
  "value": {
    "name": "Your Business",
    "industry": "Technology",
    "target_audience": "Small businesses"
  }
}
</setMemory>
```

### Create Marketing Image
```xml
<createAIImage>
{
  "model": "gemini-2.5-flash-image",
  "aspect_ratio": "16:9",
  "prompt": "Modern professional marketing banner"
}
</createAIImage>
```

### Publish Landing Page
```xml
<publishWebPage>
<!DOCTYPE html>
<html>
  <head>
    <title>Your Landing Page</title>
  </head>
  <body>
    <!-- Your HTML content -->
  </body>
</html>
</publishWebPage>
```

## License

MIT License