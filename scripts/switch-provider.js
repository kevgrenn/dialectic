#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const templatePath = path.join(process.cwd(), 'env.template');

function switchToProvider(provider) {
  if (!['anthropic', 'openai'].includes(provider)) {
    console.error('❌ Invalid provider. Use "anthropic" or "openai"');
    process.exit(1);
  }

  // Check if .env.local exists, if not create from template
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, envPath);
      console.log('📄 Created .env.local from template');
    } else {
      console.error('❌ No .env.local or env.template found');
      process.exit(1);
    }
  }

  // Read current env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update AI_PROVIDER
  if (envContent.includes('AI_PROVIDER=')) {
    envContent = envContent.replace(/AI_PROVIDER=.*/g, `AI_PROVIDER=${provider}`);
  } else {
    envContent = `AI_PROVIDER=${provider}\n` + envContent;
  }

  // Write back to file
  fs.writeFileSync(envPath, envContent);

  console.log(`✅ Switched to ${provider.toUpperCase()} provider`);
  console.log(`📝 Make sure to set your ${provider.toUpperCase()}_API_KEY in .env.local`);
  
  if (provider === 'anthropic') {
    console.log('🔑 You need: ANTHROPIC_API_KEY');
  } else {
    console.log('🔑 You need: OPENAI_API_KEY');
  }
}

// Get command line argument
const provider = process.argv[2];

if (!provider) {
  console.log('🤖 AI Provider Switcher');
  console.log('Usage: node scripts/switch-provider.js <provider>');
  console.log('Providers: anthropic, openai');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/switch-provider.js anthropic');
  console.log('  node scripts/switch-provider.js openai');
  process.exit(0);
}

switchToProvider(provider.toLowerCase()); 