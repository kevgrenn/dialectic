# AI Provider Migration Summary

## What Changed

Your Dialectic app has been successfully updated to support both **Anthropic Claude Sonnet** (default) and **OpenAI GPT-4o-mini** as AI providers, while keeping the OpenAI option available for easy switching.

**Recent Update**: The critic's system prompt has been redesigned to be more constructive and academically rigorous, focusing on thoughtful questioning and helping users strengthen their ideas rather than using sarcasm or humor.

## New Features

### 🤖 Dual AI Provider Support
- **Default**: Anthropic Claude Sonnet 4.6 (latest model)
- **Alternative**: OpenAI GPT-4o-mini (your previous setup)
- Easy switching between providers without code changes

### 🔧 Configuration System
- Environment-based provider selection
- Unified AI service that handles both providers
- Automatic API key validation

### 📝 Easy Provider Switching
- Simple npm scripts to switch providers
- Automatic environment file management
- Clear instructions and validation

### 🎯 Improved Critical Thinking
- **Constructive Criticism**: The critic now uses academic critical thinking techniques
- **Thoughtful Questioning**: Focuses on probing questions rather than sarcasm
- **Evidence-Based Analysis**: Encourages examination of factual information and research
- **Scenario Planning**: Helps users consider potential downsides and implementation challenges
- **Collaborative Tone**: Maintains a friendly, helpful approach while being rigorous

## Files Added/Modified

### New Files
- `lib/config/ai-providers.ts` - AI provider configuration
- `lib/services/ai-service.ts` - Unified AI service
- `env.template` - Environment template
- `scripts/switch-provider.js` - Provider switching utility
- `MIGRATION_SUMMARY.md` - This file

### Modified Files
- `app/api/perspective/route.ts` - Updated to use unified AI service and improved critic prompt
- `app/api/synthesis/route.ts` - Updated to use unified AI service
- `middleware.ts` - Updated to validate appropriate API keys
- `package.json` - Added Anthropic SDK and switching scripts
- `README.md` - Updated documentation

## How to Use

### Current Setup
Your app is now configured to use **Anthropic Claude Sonnet** by default. You'll need to:

1. Get an Anthropic API key from https://console.anthropic.com/
2. Add it to your `.env.local` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

### Switching to OpenAI (if needed)
If you want to switch back to OpenAI:

```bash
npm run switch:openai
```

Your existing OpenAI API key is already configured, so this will work immediately.

### Switching Back to Anthropic
```bash
npm run switch:anthropic
```

## Environment Variables

### For Anthropic (default)
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6  # optional, this is the default
```

### For OpenAI (alternative)
```
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # optional, this is the default
```

## Benefits

1. **Better AI Quality**: Claude Sonnet is generally considered more capable for complex reasoning
2. **Constructive Criticism**: The critic now helps strengthen ideas rather than just pointing out flaws
3. **Cost Flexibility**: Easy to switch between providers based on cost considerations
4. **Redundancy**: If one provider has issues, you can quickly switch to the other
5. **Future-Proof**: Easy to add more providers in the future

## Next Steps

1. **Get Anthropic API Key**: Visit https://console.anthropic.com/ to get your API key
2. **Update Environment**: Add your Anthropic API key to `.env.local`
3. **Test the App**: Run `npm run dev` and test the conversation functionality
4. **Optional**: Compare responses between providers using the switching scripts

## Support

If you encounter any issues:
1. Check that your API key is correctly set in `.env.local`
2. Verify the provider is set correctly (`AI_PROVIDER=anthropic` or `AI_PROVIDER=openai`)
3. Check the console for any error messages
4. Try switching providers to isolate the issue

The app maintains full backward compatibility with your existing OpenAI setup while adding the new Anthropic capabilities and improved critical thinking approach.