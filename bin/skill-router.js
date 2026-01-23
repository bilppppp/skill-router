#!/usr/bin/env node

/**
 * Skill Router CLI
 * 
 * 命令行工具，用于管理 AI Agent Skills 路由表
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import {
  init,
  refresh,
  addViaNpx,
  addManual,
  addManualAll,
  remove,
  list,
  show,
  validate,
  exportTable,
  exportTableBrief,
  setSkillBrief,
  REGISTRY_FILE,
} from '../src/index.js';

const program = new Command();

program
  .name('skill-router')
  .description('A CLI tool for discovering, registering, and managing AI Agent skills')
  .version('0.1.0');

// init 命令
program
  .command('init')
  .description('Initialize registry by scanning for installed skills')
  .option('-p, --project', 'Use project-level registry')
  .option('-g, --global-only', 'Only scan global skills')
  .option('--project-only', 'Only scan project skills')
  .option('-c, --clear', 'Clear existing registry before scanning')
  .action(async (options) => {
    const spinner = ora('Scanning for skills...').start();
    
    try {
      const result = await init(options);
      spinner.succeed(`Found ${result.count} skills`);
      
      if (result.skills.length > 0) {
        console.log('\nRegistered skills:');
        for (const skill of result.skills) {
          console.log(chalk.green(`  ✓ ${skill.id}`) + chalk.gray(` (${skill.path})`));
        }
      }
      
      console.log(chalk.gray(`\nRegistry saved to: ${result.registryPath}`));
    } catch (e) {
      spinner.fail('Failed to initialize');
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// refresh 命令
program
  .command('refresh')
  .description('Refresh registry by re-scanning')
  .option('-p, --project', 'Use project-level registry')
  .action(async (options) => {
    const spinner = ora('Refreshing registry...').start();
    
    try {
      const result = await refresh(options);
      spinner.succeed(`Registry refreshed: ${result.count} skills total`);
      console.log(chalk.gray(`  Manual/NPX skills kept: ${result.manualKept}`));
      console.log(chalk.gray(`  Auto-scanned skills: ${result.scanned}`));
    } catch (e) {
      spinner.fail('Failed to refresh');
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// add 命令（通过 npx add-skill）
program
  .command('add <source>')
  .description('Install a skill via npx add-skill and register it')
  .option('-p, --project', 'Use project-level registry')
  .option('-s, --skill <name>', 'Specify which skill to install from a repo')
  .option('-r, --raw', 'Treat source as raw command to execute')
  .addHelpText('after', `
Source Formats (supported by Vercel add-skill):
  # Simple skill name
  skill-router add three-writers-council

  # GitHub shorthand
  skill-router add vercel-labs/agent-skills

  # Full GitHub URL
  skill-router add https://github.com/vercel-labs/agent-skills

  # Direct path to a skill in a repo
  skill-router add https://github.com/vercel-labs/agent-skills/tree/main/skills/frontend-design

  # GitLab URL
  skill-router add https://gitlab.com/org/repo

  # Any git URL
  skill-router add git@github.com:vercel-labs/agent-skills.git

  # Specify skill name (when repo has multiple skills)
  skill-router add vercel-labs/agent-skills --skill vercel-react-best-practices

  # Raw command (for edge cases)
  skill-router add --raw "npx add-skill vercel-labs/agent-skills --skill my-skill"
`)
  .action(async (source, options) => {
    const spinner = ora(`Installing skill...`).start();
    
    try {
      const result = await addViaNpx(source, options);
      
      if (result.skill) {
        spinner.succeed(`Installed and registered: ${result.skill.name}`);
        console.log(chalk.gray(`  Path: ${result.skill.path}`));
        console.log(chalk.gray(`  Description: ${result.skill.description}`));
      } else {
        spinner.warn(result.message);
      }
    } catch (e) {
      spinner.fail('Failed to install');
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// add-path 命令（手动添加）
program
  .command('add-path <path>')
  .description('Manually add skill(s) by specifying a path')
  .option('-p, --project', 'Use project-level registry')
  .option('-a, --all', 'Recursively add all skills found in directory')
  .addHelpText('after', `
Examples:
  # Add a single skill (SKILL.md file or directory containing it)
  skill-router add-path /path/to/my-skill/SKILL.md
  skill-router add-path /path/to/my-skill/

  # Add all skills in a directory (recursive)
  skill-router add-path /path/to/skills-folder --all
  skill-router add-path .agent/skills/baoyu-skills/skills -a
`)
  .action(async (path, options) => {
    if (options.all) {
      // 递归添加所有 skills
      const spinner = ora('Scanning for skills...').start();
      
      try {
        const result = await addManualAll(path, options);
        
        if (result.success && result.count > 0) {
          spinner.succeed(`Added ${result.count} skill(s)`);
          console.log('\nRegistered skills:');
          for (const skill of result.skills) {
            console.log(chalk.green(`  ✓ ${skill.id}`) + chalk.gray(` (${skill.path})`));
          }
        } else {
          spinner.warn(result.message || 'No skills found');
        }
      } catch (e) {
        spinner.fail('Failed to add');
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    } else {
      // 添加单个 skill
      const spinner = ora('Adding skill...').start();
      
      try {
        const result = await addManual(path, options);
        spinner.succeed(`Added: ${result.skill.name} (${result.skill.id})`);
        console.log(chalk.gray(`  Path: ${result.skill.path}`));
        console.log(chalk.gray(`  Description: ${result.skill.description}`));
      } catch (e) {
        spinner.fail('Failed to add');
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    }
  });

// remove 命令
program
  .command('remove <skill-id>')
  .description('Remove a skill from the registry')
  .option('-p, --project', 'Use project-level registry')
  .action(async (skillId, options) => {
    try {
      const result = await remove(skillId, options);
      console.log(chalk.green(`✓ Removed: ${result.removed}`));
    } catch (e) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
  });

// list 命令
program
  .command('list')
  .alias('ls')
  .description('List all registered skills')
  .option('-p, --project', 'Use project-level registry')
  .option('-v, --verbose', 'Show detailed information')
  .action((options) => {
    const skills = list(options);
    
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills registered. Run `skill-router init` to scan for skills.'));
      return;
    }
    
    console.log(chalk.bold(`\nRegistered Skills (${skills.length}):\n`));
    
    for (const skill of skills) {
      const sourceTag = chalk.gray(`[${skill.source}]`);
      console.log(`${chalk.green(skill.id)} ${sourceTag}`);
      console.log(chalk.gray(`  ${skill.description || 'No description'}`));
      
      if (options.verbose) {
        console.log(chalk.gray(`  Path: ${skill.path}`));
        console.log(chalk.gray(`  Manifest: ${skill.manifest}`));
        if (skill.inputs?.length) console.log(chalk.gray(`  Inputs: ${skill.inputs.join(', ')}`));
        if (skill.outputs?.length) console.log(chalk.gray(`  Outputs: ${skill.outputs.join(', ')}`));
        if (skill.tags?.length) console.log(chalk.gray(`  Tags: ${skill.tags.join(', ')}`));
      }
      console.log();
    }
  });

// show 命令
program
  .command('show <skill-id>')
  .description('Show detailed information about a skill')
  .option('-p, --project', 'Use project-level registry')
  .action((skillId, options) => {
    const skill = show(skillId, options);
    
    if (!skill) {
      console.error(chalk.red(`Skill not found: ${skillId}`));
      process.exit(1);
    }
    
    console.log(chalk.bold(`\n${skill.name}\n`));
    console.log(`ID:          ${skill.id}`);
    console.log(`Version:     ${skill.version || 'N/A'}`);
    console.log(`Source:      ${skill.source}`);
    console.log(`Path:        ${skill.path}`);
    console.log(`Manifest:    ${skill.manifest}`);
    console.log(`Description: ${skill.description || 'N/A'}`);
    
    if (skill.inputs?.length) {
      console.log(`Inputs:      ${skill.inputs.join(', ')}`);
    }
    if (skill.outputs?.length) {
      console.log(`Outputs:     ${skill.outputs.join(', ')}`);
    }
    if (skill.tags?.length) {
      console.log(`Tags:        ${skill.tags.join(', ')}`);
    }
    if (skill.references?.length) {
      console.log(`References:  ${skill.references.join(', ')}`);
    }
    if (skill.author) {
      console.log(`Author:      ${skill.author}`);
    }
    
    console.log(`Registered:  ${skill.registered_at}`);
    if (skill.updated_at) {
      console.log(`Updated:     ${skill.updated_at}`);
    }
  });

// validate 命令
program
  .command('validate')
  .description('Validate that all registered skill paths exist')
  .option('-p, --project', 'Use project-level registry')
  .action((options) => {
    const result = validate(options);
    
    console.log(chalk.bold('\nRegistry Validation:\n'));
    
    if (result.valid.length > 0) {
      console.log(chalk.green(`✓ Valid: ${result.valid.length} skills`));
      for (const skill of result.valid) {
        console.log(chalk.gray(`    ${skill.id}`));
      }
    }
    
    if (result.invalid.length > 0) {
      console.log(chalk.red(`\n✗ Invalid: ${result.invalid.length} skills (paths not found)`));
      for (const skill of result.invalid) {
        console.log(chalk.red(`    ${skill.id}`));
        console.log(chalk.gray(`      Missing: ${skill.manifest}`));
      }
      console.log(chalk.yellow('\nRun `skill-router refresh` to clean up invalid entries.'));
    } else {
      console.log(chalk.green('\nAll paths are valid!'));
    }
  });

// export 命令
program
  .command('export')
  .description('Export registry as routing table for agent context')
  .option('-p, --project', 'Use project-level registry')
  .option('-b, --brief', 'Export brief version (one-line descriptions, less tokens)')
  .option('-f, --format <format>', 'Output format: markdown | json', 'markdown')
  .option('-o, --output <file>', 'Output to file instead of stdout')
  .action(async (options) => {
    let result;
    
    if (options.brief) {
      result = exportTableBrief(options);
    } else {
      result = exportTable(options);
    }
    
    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, 
        options.format === 'json' ? JSON.stringify(result, null, 2) : result
      );
      console.log(chalk.green(`✓ Exported to ${options.output}`));
    } else {
      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    }
  });

// set-brief 命令
program
  .command('set-brief <skill-id> <brief>')
  .description('Set a custom brief (one-line description) for a skill')
  .option('-p, --project', 'Use project-level registry')
  .action((skillId, brief, options) => {
    try {
      const skill = setSkillBrief(skillId, brief, options);
      console.log(chalk.green(`✓ Updated brief for ${skill.id}`));
      console.log(chalk.gray(`  Brief: ${skill.brief}`));
    } catch (e) {
      console.error(chalk.red(`✗ ${e.message}`));
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse();
