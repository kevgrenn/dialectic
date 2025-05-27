# Dialectic

Dialectic is a web application designed to improve understanding and thinking through structured dialectical conversations between the user and two AI perspectives.

## Core Purpose

To facilitate deeper understanding and clearer thinking by presenting contrasting viewpoints in a structured format, allowing users to explore topics from multiple angles.

## Features

- **Prompt-Based Exploration**
  - Enter your thoughts or questions on any topic
  - Immediate analysis by AI perspectives

- **AI Dialectic Processing**
  - Analysis of user input to identify key topics/claims
  - Generation of two opposing AI perspectives
  - Structured debate format between perspectives

- **User Interaction**
  - Ability to participate in the conversation
  - Option to steer or refocus the discussion
  - Simple controls to progress through the dialectic process

- **Synthesis & Output**
  - Summary of key insights from the dialectical process
  - Identification of consensus points and remaining questions
  - Basic export functionality

## Technical Stack

- **Frontend**: Next.js, TailwindCSS, shadcn/ui
- **State Management**: React Context API
- **AI Integration**: Anthropic Claude Sonnet (default) or OpenAI GPT-4o-mini

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn
- AI API key (Anthropic or OpenAI)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/dialectic.git
   cd dialectic
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up your environment variables:
   
   Copy the environment template and configure your API keys:
   ```bash
   cp env.template .env.local
   ```
   
   Then edit `.env.local` with your API key:
   
   **For Anthropic Claude (default):**
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
   
   **For OpenAI (alternative):**
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## AI Provider Configuration

The application supports both Anthropic Claude and OpenAI models:

### Default Configuration (Anthropic Claude)
- **Provider**: Anthropic
- **Model**: claude-3-5-sonnet-20241022
- **Required**: `ANTHROPIC_API_KEY` environment variable

### Alternative Configuration (OpenAI)
To use OpenAI instead, set these environment variables:
```
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

### Custom Model Configuration
You can customize the specific models used:
```
# For Anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# For OpenAI  
OPENAI_MODEL=gpt-4o-mini
```

### Switching Between Providers
You can easily switch between AI providers using the included scripts:

```bash
# Switch to Anthropic Claude (default)
npm run switch:anthropic

# Switch to OpenAI
npm run switch:openai
```

These scripts will automatically update your `.env.local` file with the correct provider setting.

## User Flow

1. User opens the app and sees welcome screen with "Start Thinking" button
2. User clicks button and enters their thoughts on a topic
3. Two AI perspectives analyze the user's input from different angles
4. User can participate in the conversation by adding more thoughts
5. After exploring the topic, user generates a synthesis
6. User reviews synthesis and can export or start a new session

## API Integration

The application uses AI APIs to generate:
1. A supportive perspective that affirms and extends the user's ideas
2. A critical perspective that challenges assumptions and offers alternatives
3. A synthesis that identifies key points, consensus areas, and remaining questions

The API calls are handled server-side through Next.js API routes for security.

## Future Enhancements

- User authentication and saved sessions
- More customizable AI perspectives
- Enhanced visualization of the dialectical process
- Mobile app version
- Voice input option for accessibility

## License

This project is licensed under the MIT License - see the LICENSE file for details.
