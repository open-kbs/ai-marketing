# AI Marketing Agent

A white-label marketing assistant that can be branded for any market, country, and business.

## Architecture

When adding/modifying commands, update all related files:
1. `src/Events/actions.js` - Implementation
2. `app/instructions.txt` - Agent documentation
3. `src/Frontend/contentRender.js` - Pattern matching
4. `src/Frontend/CommandRenderer.js` - UI rendering

## Features

- **Multi-language Support**: Adapts to user's preferred language
- **Business Interview**: Flexible onboarding to gather business information
- **Memory System**: Persistent storage with expiration support
- **Content Creation**: AI-powered image and video generation
- **Web Publishing**: Create landing pages and marketing materials
- **Task Scheduling**: Automated reminders and scheduled tasks
- **Search Integration**: Google search and image search
- **Email Communication**: Send marketing emails

## Command Format

All commands use JSON within XML tags:
```
<commandName>
{
  "parameter1": "value1",
  "parameter2": "value2"
}
</commandName>
```

## Memory Structure

Uses simple key-value storage with `memory_` prefix:
- `memory_business_profile` - Core business information
- `memory_preferences` - User preferences
- `memory_content_ideas` - Content drafts
- `memory_campaigns` - Campaign data

## Customization

1. Update `app/settings.json` for branding
2. Modify `app/instructions.txt` for behavior
3. Adjust templates in `webPublishingGuide.js`
4. Configure language and market preferences