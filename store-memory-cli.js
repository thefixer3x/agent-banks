#!/usr/bin/env node

/**
 * CLI tool to store memories in SD-Ghost Protocol
 * 
 * Usage:
 *   node store-memory-cli.js "Title" "Content" [options]
 * 
 * Options:
 *   --type <type>      Memory type (conversation|knowledge|project|context|reference)
 *   --tags <tags>      Comma-separated tags
 *   --project <ref>    Project reference
 *   --summary <text>   Summary text
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📝 SD-Ghost Protocol Memory Storage CLI

Usage:
  node store-memory-cli.js "Title" "Content" [options]

Options:
  --type <type>      Memory type (default: knowledge)
                     Options: conversation, knowledge, project, context, reference
  --tags <tags>      Comma-separated tags
  --project <ref>    Project reference (default: general)
  --summary <text>   Summary text (auto-generated if not provided)

Examples:
  node store-memory-cli.js "Meeting Notes" "Discussed Q1 roadmap..." --type project --tags meeting,planning
  node store-memory-cli.js "JavaScript Tips" "Use const for immutable values" --tags javascript,tips
`);
    process.exit(0);
  }

  const options = {
    title: args[0],
    content: args[1],
    type: 'knowledge',
    tags: [],
    project: 'general',
    summary: null
  };

  // Parse optional arguments
  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--type':
        options.type = value;
        break;
      case '--tags':
        options.tags = value.split(',').map(t => t.trim());
        break;
      case '--project':
        options.project = value;
        break;
      case '--summary':
        options.summary = value;
        break;
    }
  }

  return options;
}

// Store memory function
async function storeMemory(options) {
  try {
    console.log('🧠 Storing memory...\n');
    console.log('Title:', options.title);
    console.log('Type:', options.type);
    console.log('Project:', options.project);
    console.log('Tags:', options.tags.join(', ') || 'none');
    console.log('\n');

    // Generate embedding if possible
    let embedding = null;
    try {
      const { data: embeddingResponse } = await supabase.functions.invoke('generate-embedding', {
        body: { text: options.content }
      });
      
      if (embeddingResponse?.embedding) {
        embedding = JSON.stringify(embeddingResponse.embedding);
        console.log('✅ Generated embedding for semantic search');
      }
    } catch (error) {
      console.log('⚠️  Could not generate embedding (will use text search)');
    }

    // Store the memory
    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        title: options.title,
        content: options.content,
        summary: options.summary || options.content.substring(0, 200) + '...',
        memory_type: options.type,
        status: 'active',
        relevance_score: 1.0,
        tags: options.tags,
        project_ref: options.project,
        embedding: embedding,
        metadata: {
          source: 'cli',
          created_via: 'store-memory-cli'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store memory:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Memory stored successfully!');
    console.log('Memory ID:', data.id);
    console.log('Created at:', new Date(data.created_at).toLocaleString());
    
    // Show search preview
    console.log('\n🔍 You can now search for this memory using:');
    console.log(`   - Title: "${options.title}"`);
    if (options.tags.length > 0) {
      console.log(`   - Tags: ${options.tags.join(', ')}`);
    }
    console.log(`   - Project: ${options.project}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Interactive mode
async function interactiveMode() {
  console.log('🧠 SD-Ghost Protocol - Interactive Memory Storage\n');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  try {
    const title = await question('Title: ');
    console.log('Content (press Enter twice to finish):');
    
    let content = '';
    let emptyLines = 0;
    
    rl.on('line', (line) => {
      if (line === '') {
        emptyLines++;
        if (emptyLines >= 2) {
          rl.close();
        } else {
          content += '\n';
        }
      } else {
        emptyLines = 0;
        content += line + '\n';
      }
    });

    await new Promise((resolve) => rl.on('close', resolve));

    const type = await question('\nType (knowledge/project/conversation/context/reference) [knowledge]: ') || 'knowledge';
    const tags = await question('Tags (comma-separated): ');
    const project = await question('Project reference [general]: ') || 'general';
    const summary = await question('Summary (optional): ');

    await storeMemory({
      title,
      content: content.trim(),
      type,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      project,
      summary: summary || null
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--interactive' || args[0] === '-i') {
    await interactiveMode();
  } else {
    const options = parseArgs();
    await storeMemory(options);
  }
}

// Run the CLI
main().catch(console.error);